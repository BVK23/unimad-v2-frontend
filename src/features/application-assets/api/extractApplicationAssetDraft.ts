import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { formatCoverLetterDate, normalizeCoverLetterDatePlaceholders } from "@/features/application-assets/utils/formatCoverLetterDate";

export type ApplicationAssetDraftPayload = {
  draft: string;
  assetType?: ApplicationAssetApiType;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
};

const JSON_FENCE_GLOBAL_REGEX = /```\s*json\s*([\s\S]*?)```/gi;
const INLINE_DRAFT_JSON_REGEX = /\{\s*"data"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;

/** Sibling metadata keys that follow `data` in the draft envelope. */
const DRAFT_SIBLING_KEYS = "asset_type|role|company|job_description|jd|contact_name|hirname|conname";
/** Start of the `data` field: `"data": "`. */
const DATA_FIELD_START_REGEX = /"data"\s*:\s*"/;
/** Boundary between the `data` value and the first sibling metadata key: `", "asset_type":`. */
const DRAFT_SIBLING_BOUNDARY_REGEX = new RegExp(`"\\s*,\\s*"(?:${DRAFT_SIBLING_KEYS})"\\s*:`);
/** Legacy greedy terminator (last quote before a closing brace). */
const LEGACY_DATA_END_REGEX = /^([\s\S]*)"\s*\}/;
/** A dangling closing quote and/or whitespace at the end of a truncated stream. */
const TRAILING_QUOTE_REGEX = /"?\s*$/;

const unescapeJsonishString = (raw: string): string =>
  raw.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");

/**
 * Recovers the `data` body from a MALFORMED draft envelope (unescaped quote in
 * the body, control chars, or a truncated stream) that `JSON.parse` rejected.
 *
 * Strategy — deliberately a SUPERSET of the legacy greedy extractor so detection
 * can never regress (an empty result here would let the raw JSON/body leak into
 * the chat bubble instead of collapsing to the review line):
 *   1. Cut at the first sibling metadata key so `asset_type`/`role`/`company`/
 *      `contact_name` never leak into the rendered document body.
 *   2. Otherwise fall back to the legacy greedy terminator (last quote before a
 *      closing brace) — identical to the previous behavior when no siblings exist.
 *   3. Otherwise (truncated stream, no closing brace) take the remainder.
 */
const recoverMalformedDraftBody = (fenceInner: string): string | null => {
  const start = fenceInner.match(DATA_FIELD_START_REGEX);
  if (start?.index === undefined) {
    return null;
  }
  const afterData = fenceInner.slice(start.index + start[0].length);

  const boundaryIndex = afterData.search(DRAFT_SIBLING_BOUNDARY_REGEX);
  if (boundaryIndex !== -1) {
    return unescapeJsonishString(afterData.slice(0, boundaryIndex));
  }

  const legacy = afterData.match(LEGACY_DATA_END_REGEX);
  if (legacy?.[1]) {
    return unescapeJsonishString(legacy[1]);
  }

  const remainder = afterData.replace(TRAILING_QUOTE_REGEX, "");
  return remainder ? unescapeJsonishString(remainder) : null;
};

const VALID_TYPES = new Set<ApplicationAssetApiType>(["coverletter", "coldemail", "referral"]);

const formatDraftString = (s: string): string =>
  s
    .replace(/^\s*\*\s+/gm, "* ")
    .replace(/([^\n])\n(?!\n)/g, "$1  \n")
    .trim();

const cleanJsonPayload = (raw: string): string =>
  raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\\(\r\n|\n|\r)/g, "\\n")
    .trim();

const mergePayload = (current: ApplicationAssetDraftPayload, candidate: ApplicationAssetDraftPayload): ApplicationAssetDraftPayload => ({
  draft: candidate.draft.length > current.draft.length ? candidate.draft : current.draft,
  assetType: candidate.assetType ?? current.assetType,
  role: candidate.role?.trim() || current.role,
  company: candidate.company?.trim() || current.company,
  jobDescription: candidate.jobDescription?.trim() || current.jobDescription,
  contactName: candidate.contactName?.trim() || current.contactName,
});

const payloadFromParsedObject = (parsed: Record<string, unknown>): ApplicationAssetDraftPayload | null => {
  const dataValue = parsed.data;
  if (typeof dataValue !== "string") {
    return null;
  }
  const rawType = typeof parsed.asset_type === "string" ? parsed.asset_type.trim() : "";
  const assetType = VALID_TYPES.has(rawType as ApplicationAssetApiType) ? (rawType as ApplicationAssetApiType) : undefined;
  let draft = formatDraftString(dataValue);
  if (assetType === "coverletter") {
    draft = normalizeCoverLetterDatePlaceholders(draft, formatCoverLetterDate());
  }
  if (!draft) {
    return null;
  }
  const role = typeof parsed.role === "string" ? parsed.role.trim() : undefined;
  const company = typeof parsed.company === "string" ? parsed.company.trim() : undefined;
  const jobDescription =
    typeof parsed.job_description === "string"
      ? parsed.job_description.trim()
      : typeof parsed.jd === "string"
        ? parsed.jd.trim()
        : undefined;
  const contactName =
    typeof parsed.contact_name === "string"
      ? parsed.contact_name.trim()
      : typeof parsed.hirname === "string"
        ? parsed.hirname.trim()
        : typeof parsed.conname === "string"
          ? parsed.conname.trim()
          : undefined;

  return { draft, assetType, role, company, jobDescription, contactName };
};

export const extractApplicationAssetDraftPayload = (botMessage: string): ApplicationAssetDraftPayload => {
  let best: ApplicationAssetDraftPayload = { draft: "" };

  INLINE_DRAFT_JSON_REGEX.lastIndex = 0;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = INLINE_DRAFT_JSON_REGEX.exec(botMessage)) !== null) {
    try {
      const unescaped = inlineMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      best = mergePayload(best, { draft: formatDraftString(unescaped) });
    } catch {
      // continue
    }
  }

  JSON_FENCE_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_GLOBAL_REGEX.exec(botMessage)) !== null) {
    try {
      const parsed = JSON.parse(cleanJsonPayload(match[1])) as Record<string, unknown>;
      const candidate = payloadFromParsedObject(parsed);
      if (candidate) {
        best = mergePayload(best, candidate);
      }
    } catch {
      const recovered = recoverMalformedDraftBody(match[1]);
      if (recovered) {
        best = mergePayload(best, { draft: formatDraftString(recovered) });
      }
    }
  }

  return best;
};

export const extractApplicationAssetDraftFromBotMessage = (botMessage: string): string =>
  extractApplicationAssetDraftPayload(botMessage).draft;
