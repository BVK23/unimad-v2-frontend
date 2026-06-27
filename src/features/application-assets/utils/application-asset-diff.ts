import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";

/**
 * Block-level HTML diff and anchored reconciliation for application asset drafts.
 *
 * ADK regenerates the entire document. This module:
 * 1. Splits HTML into top-level blocks (p, h1-h3, li, div, etc.)
 * 2. Matches common prefix/suffix blocks between baseline and proposed
 * 3. Forces unchanged regions back to baseline (anchor-protect)
 * 4. Produces per-block diff regions for the UI to highlight and review
 */

export type DiffRegionKind = "unchanged" | "changed" | "added" | "removed";

export type DiffRegion = {
  id: string;
  kind: DiffRegionKind;
  /** Final HTML for this region (proposed for changed/added, baseline for unchanged). */
  html: string;
  /** Baseline HTML when available (for undo). */
  baselineHtml: string | null;
};

export type ReconcileResult = {
  regions: DiffRegion[];
  reconciledHtml: string;
};

const BLOCK_TAG_RE = /^<(p|h[1-6]|li|ul|ol|div|blockquote|table|tr|section|article|header|footer|pre|hr)\b/i;

/**
 * Split an HTML string into top-level block elements.
 * Inline-only fragments between blocks are preserved as synthetic `<p>` wrappers.
 */
export const splitHtmlBlocks = (html: string): string[] => {
  const container = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  const blocks: string[] = [];
  for (let i = 0; i < container.childNodes.length; i++) {
    const node = container.childNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (BLOCK_TAG_RE.test(el.outerHTML)) {
        blocks.push(el.outerHTML);
      } else {
        const wrapped = el.outerHTML.trim();
        if (wrapped) blocks.push(wrapped);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) blocks.push(`<p>${text}</p>`);
    }
  }
  return blocks;
};

/** Normalize text content of an HTML block for comparison. */
export const normalizeBlockText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Simple similarity score between 0 and 1 using character bigrams (Dice coefficient). */
const bigrams = (s: string): Set<string> => {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    set.add(s.slice(i, i + 2));
  }
  return set;
};

const similarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const ba = bigrams(a);
  const bb = bigrams(b);
  let overlap = 0;
  for (const x of ba) {
    if (bb.has(x)) overlap++;
  }
  return (2 * overlap) / (ba.size + bb.size);
};

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Count how many leading blocks in `baseBlocks` match `propBlocks`
 * above the similarity threshold.
 */
const matchPrefix = (baseBlocks: string[], propBlocks: string[]): number => {
  const limit = Math.min(baseBlocks.length, propBlocks.length);
  let count = 0;
  for (let i = 0; i < limit; i++) {
    const baseTxt = normalizeBlockText(baseBlocks[i]);
    const propTxt = normalizeBlockText(propBlocks[i]);
    if (similarity(baseTxt, propTxt) >= SIMILARITY_THRESHOLD) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

/**
 * Count how many trailing blocks match (working backwards), excluding
 * any that overlap with the already-matched prefix.
 */
const matchSuffix = (baseBlocks: string[], propBlocks: string[], prefixLen: number): number => {
  const baseRemaining = baseBlocks.length - prefixLen;
  const propRemaining = propBlocks.length - prefixLen;
  const limit = Math.min(baseRemaining, propRemaining);
  let count = 0;
  for (let i = 0; i < limit; i++) {
    const baseIdx = baseBlocks.length - 1 - i;
    const propIdx = propBlocks.length - 1 - i;
    const baseTxt = normalizeBlockText(baseBlocks[baseIdx]);
    const propTxt = normalizeBlockText(propBlocks[propIdx]);
    if (similarity(baseTxt, propTxt) >= SIMILARITY_THRESHOLD) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

let regionCounter = 0;
const nextRegionId = (): string => `diff-region-${Date.now()}-${++regionCounter}`;

/**
 * Reconcile an ADK-regenerated document with the baseline, anchored around
 * the user's selected text. Blocks outside the changed middle are forced
 * back to baseline (anchor-protect).
 */
const plainNeedle = (text: string): string =>
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const scoreBlockAnchorOverlap = (blockText: string, needle: string): number => {
  if (!needle || !blockText) return 0;
  if (blockText.includes(needle)) return needle.length;
  if (needle.includes(blockText) && blockText.length > 20) return blockText.length;
  return similarity(blockText, needle) * Math.min(blockText.length, needle.length);
};

/** Pick the best anchor block; expand to adjacent blocks only when selection clearly spans multiple. */
const findAnchorBlockRange = (blocks: string[], anchorSelectedText: string): { start: number; end: number } | null => {
  const needle = plainNeedle(anchorSelectedText);
  if (needle.length < 8) return null;

  let bestIdx = -1;
  let bestScore = 0;
  const scores: number[] = blocks.map((block, i) => {
    const blockText = normalizeBlockText(block);
    const score = scoreBlockAnchorOverlap(blockText, needle);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    return score;
  });

  if (bestIdx < 0 || bestScore < needle.length * 0.35) {
    const needleWords = needle.split(" ").filter(w => w.length > 3);
    if (needleWords.length >= 2) {
      const snippet = needleWords.slice(0, 6).join(" ");
      blocks.forEach((block, i) => {
        if (normalizeBlockText(block).includes(snippet) && bestIdx < 0) {
          bestIdx = i;
          bestScore = snippet.length;
        }
      });
    }
  }

  if (bestIdx < 0) return null;

  const threshold = bestScore * 0.65;
  let start = bestIdx;
  let end = bestIdx;

  while (start > 0 && scores[start - 1] >= threshold) {
    start -= 1;
  }
  while (end < blocks.length - 1 && scores[end + 1] >= threshold) {
    end += 1;
  }

  return { start, end };
};

const ensureChangedRegions = (regions: DiffRegion[], baselineHtml: string, proposedHtml: string): DiffRegion[] => {
  const hasChanged = regions.some(r => r.kind !== "unchanged");
  if (hasChanged) return regions;
  if (normalizeBlockText(baselineHtml) === normalizeBlockText(proposedHtml)) return regions;
  return fallbackSingleRegion(baselineHtml, proposedHtml).regions;
};

export const reconcileAnchoredDraft = ({
  baselineDraft,
  proposedDraft,
  anchorSelectedText,
}: {
  baselineDraft: string;
  proposedDraft: string;
  anchorSelectedText?: string;
}): ReconcileResult => {
  const baselineHtml = normalizeContentToHtml(baselineDraft);
  const proposedHtml = normalizeContentToHtml(proposedDraft);

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return fallbackSingleRegion(baselineHtml, proposedHtml);
  }

  const baseBlocks = splitHtmlBlocks(baselineHtml);
  const propBlocks = splitHtmlBlocks(proposedHtml);

  if (baseBlocks.length === 0 || propBlocks.length === 0) {
    return fallbackSingleRegion(baselineHtml, proposedHtml);
  }

  const anchorOnBase = anchorSelectedText?.trim() ? findAnchorBlockRange(baseBlocks, anchorSelectedText) : null;
  const anchorOnProp = anchorSelectedText?.trim() ? findAnchorBlockRange(propBlocks, anchorSelectedText) : null;

  let baseMiddleStart: number;
  let baseMiddleEnd: number;
  let propMiddleStart: number;
  let propMiddleEnd: number;
  let prefixLen: number;
  let suffixLen: number;

  if (anchorOnBase) {
    baseMiddleStart = anchorOnBase.start;
    baseMiddleEnd = anchorOnBase.end + 1;
    if (anchorOnProp) {
      propMiddleStart = anchorOnProp.start;
      propMiddleEnd = anchorOnProp.end + 1;
    } else {
      propMiddleStart = Math.min(anchorOnBase.start, propBlocks.length);
      propMiddleEnd = Math.min(anchorOnBase.end + 1, propBlocks.length);
    }
    prefixLen = baseMiddleStart;
    suffixLen = baseBlocks.length - baseMiddleEnd;
  } else {
    prefixLen = matchPrefix(baseBlocks, propBlocks);
    suffixLen = matchSuffix(baseBlocks, propBlocks, prefixLen);
    baseMiddleStart = prefixLen;
    baseMiddleEnd = baseBlocks.length - suffixLen;
    propMiddleStart = prefixLen;
    propMiddleEnd = propBlocks.length - suffixLen;
  }

  if (baseMiddleStart >= baseMiddleEnd && propMiddleStart >= propMiddleEnd) {
    const regions: DiffRegion[] = baseBlocks.map(block => ({
      id: nextRegionId(),
      kind: "unchanged" as const,
      html: block,
      baselineHtml: block,
    }));
    return { regions: ensureChangedRegions(regions, baselineHtml, proposedHtml), reconciledHtml: baseBlocks.join("") };
  }

  const regions: DiffRegion[] = [];

  for (let i = 0; i < prefixLen; i++) {
    regions.push({
      id: nextRegionId(),
      kind: "unchanged",
      html: baseBlocks[i],
      baselineHtml: baseBlocks[i],
    });
  }

  const baseMiddle = baseBlocks.slice(baseMiddleStart, baseMiddleEnd);
  const propMiddle = propBlocks.slice(propMiddleStart, propMiddleEnd);

  const middleRegions = anchorOnBase ? diffAnchoredMiddleBlocks(baseMiddle, propMiddle) : diffMiddleBlocks(baseMiddle, propMiddle, false);
  regions.push(...middleRegions);

  for (let i = 0; i < suffixLen; i++) {
    const baseIdx = baseBlocks.length - suffixLen + i;
    regions.push({
      id: nextRegionId(),
      kind: "unchanged",
      html: baseBlocks[baseIdx],
      baselineHtml: baseBlocks[baseIdx],
    });
  }

  const reconciledHtml = regions.map(r => r.html).join("");
  const finalRegions = ensureChangedRegions(regions, baselineHtml, proposedHtml);

  return { regions: finalRegions, reconciledHtml };
};

/**
 * When the user anchored a selection, treat the middle as one logical edit even if
 * the LLM returned a different block count (avoids spurious "added" regions).
 */
const diffAnchoredMiddleBlocks = (baseMiddle: string[], propMiddle: string[]): DiffRegion[] => {
  const baseHtml = baseMiddle.join("");
  const propHtml = propMiddle.join("");

  if (!baseHtml && !propHtml) {
    return [];
  }

  if (!baseHtml && propHtml) {
    return [
      {
        id: nextRegionId(),
        kind: "added",
        html: propHtml,
        baselineHtml: null,
      },
    ];
  }

  if (baseHtml && !propHtml) {
    return [
      {
        id: nextRegionId(),
        kind: "removed",
        html: "",
        baselineHtml: baseHtml,
      },
    ];
  }

  if (normalizeBlockText(baseHtml) === normalizeBlockText(propHtml)) {
    return [
      {
        id: nextRegionId(),
        kind: "unchanged",
        html: baseHtml,
        baselineHtml: baseHtml,
      },
    ];
  }

  return [
    {
      id: nextRegionId(),
      kind: "changed",
      html: propHtml,
      baselineHtml: baseHtml,
    },
  ];
};

/**
 * Diff the middle (divergent) blocks between baseline and proposed.
 * Uses positional comparison to produce changed/added/removed regions.
 */
const diffMiddleBlocks = (baseMiddle: string[], propMiddle: string[], strictAnchor = false): DiffRegion[] => {
  const regions: DiffRegion[] = [];
  const maxLen = Math.max(baseMiddle.length, propMiddle.length);
  const threshold = strictAnchor ? 1 : SIMILARITY_THRESHOLD;

  for (let i = 0; i < maxLen; i++) {
    const baseBlock = i < baseMiddle.length ? baseMiddle[i] : null;
    const propBlock = i < propMiddle.length ? propMiddle[i] : null;

    if (baseBlock && propBlock) {
      const baseTxt = normalizeBlockText(baseBlock);
      const propTxt = normalizeBlockText(propBlock);
      if (similarity(baseTxt, propTxt) >= threshold) {
        regions.push({
          id: nextRegionId(),
          kind: "unchanged",
          html: baseBlock,
          baselineHtml: baseBlock,
        });
      } else {
        regions.push({
          id: nextRegionId(),
          kind: "changed",
          html: propBlock,
          baselineHtml: baseBlock,
        });
      }
    } else if (propBlock && !baseBlock) {
      regions.push({
        id: nextRegionId(),
        kind: "added",
        html: propBlock,
        baselineHtml: null,
      });
    } else if (baseBlock && !propBlock) {
      regions.push({
        id: nextRegionId(),
        kind: "removed",
        html: "",
        baselineHtml: baseBlock,
      });
    }
  }

  return regions;
};

const fallbackSingleRegion = (baselineDraft: string, proposedDraft: string): ReconcileResult => {
  const baseNorm = normalizeBlockText(baselineDraft);
  const propNorm = normalizeBlockText(proposedDraft);
  if (baseNorm === propNorm) {
    return {
      regions: [
        {
          id: nextRegionId(),
          kind: "unchanged",
          html: baselineDraft,
          baselineHtml: baselineDraft,
        },
      ],
      reconciledHtml: baselineDraft,
    };
  }
  return {
    regions: [
      {
        id: nextRegionId(),
        kind: "changed",
        html: proposedDraft,
        baselineHtml: baselineDraft,
      },
    ],
    reconciledHtml: proposedDraft,
  };
};

/**
 * Build final reconciled HTML from regions and per-region keep/undo decisions.
 * A kept region uses proposed HTML; an undone region uses baseline HTML.
 * Regions without a decision default to "kept" (proposed).
 */
export const buildReconciledHtml = (regions: DiffRegion[], decisions: Record<string, "keep" | "undo">): string => {
  return regions
    .map(region => {
      if (region.kind === "unchanged") return region.html;
      const decision = decisions[region.id] ?? "keep";
      if (decision === "undo") {
        if (region.kind === "added") return "";
        return region.baselineHtml ?? "";
      }
      if (region.kind === "removed") return "";
      return region.html;
    })
    .filter(Boolean)
    .join("");
};
