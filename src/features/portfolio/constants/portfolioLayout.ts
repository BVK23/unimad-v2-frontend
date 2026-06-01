import type { ColumnSpan, ContentType, PortfolioItem } from "@/types";

/** Layout roles aligned with BlockNote template slots (12-column grid). */
export type PortfolioLayoutRole = "section" | "halfCard" | "linkChip" | "inlineMedia" | "quote" | "mediaHero";

export const PORTFOLIO_SPAN_BY_ROLE: Record<PortfolioLayoutRole, ColumnSpan> = {
  section: 12,
  halfCard: 6,
  linkChip: 12,
  inlineMedia: 6,
  quote: 12,
  mediaHero: 12,
};

const LEGACY_TEMPLATE_SPANS = new Set<number>([2, 4]);

/** Pixel height used when creating items and before ResizeObserver runs. */
export const DEFAULT_ITEM_HEIGHT_PX = 160;

export const DEFAULT_ITEM_HEIGHT_BY_TYPE: Partial<Record<ContentType, number>> = {
  text: 160,
  media: 240,
  "page-card": 280,
  project: 280,
  "link-box": 96,
  table: 200,
  embed: 260,
};

export const getDefaultItemHeightPx = (type: ContentType): number => DEFAULT_ITEM_HEIGHT_BY_TYPE[type] ?? DEFAULT_ITEM_HEIGHT_PX;

/** Grid track height for `grid-row-end: span N` with fixed row size + gap. */
export const gridTrackHeightForSpan = (span: number, rowHeightPx: number, rowGapPx: number): number =>
  span * rowHeightPx + Math.max(0, span - 1) * rowGapPx;

export const gridRowSpanForHeightPx = (heightPx: number, minRows: number, rowHeightPx: number, rowGapPx: number): number => {
  let span = Math.max(1, minRows);
  while (span < 120 && gridTrackHeightForSpan(span, rowHeightPx, rowGapPx) < heightPx) {
    span += 1;
  }
  return span;
};

export const getMinGridRowsForItem = (type: ContentType): number => {
  if (type === "link-box") return 2;
  if (type === "text") return 3;
  return 8;
};

export const getDefaultSpanForContentType = (type: ContentType): ColumnSpan => {
  if (type === "link-box") return PORTFOLIO_SPAN_BY_ROLE.linkChip;
  if (type === "text") return PORTFOLIO_SPAN_BY_ROLE.section;
  if (type === "page-card") return PORTFOLIO_SPAN_BY_ROLE.halfCard;
  if (type === "media") return PORTFOLIO_SPAN_BY_ROLE.mediaHero;
  if (type === "table" || type === "embed") return 8;
  return PORTFOLIO_SPAN_BY_ROLE.section;
};

const resolveLayoutRole = (item: PortfolioItem): PortfolioLayoutRole | null => {
  const role = (item as PortfolioItem & { layoutRole?: PortfolioLayoutRole }).layoutRole;
  if (role && role in PORTFOLIO_SPAN_BY_ROLE) {
    return role;
  }

  if (item.type === "page-card") return "halfCard";
  if (item.type === "link-box") return "linkChip";
  if (item.type === "media") {
    return item.mediaType === "video" ? "mediaHero" : "inlineMedia";
  }
  if (item.type === "text") {
    const withRole = item as PortfolioItem & { layoutRole?: PortfolioLayoutRole };
    if (withRole.layoutRole === "quote") return "quote";
    return "section";
  }

  return null;
};

const shouldNormalizeItemSpan = (item: PortfolioItem): boolean => {
  if (typeof item.colStart === "number") {
    return false;
  }

  const rawSpan = Number(item.span);
  if (!LEGACY_TEMPLATE_SPANS.has(rawSpan)) {
    return false;
  }

  const role = resolveLayoutRole(item);
  if (!role) {
    return false;
  }

  return rawSpan !== PORTFOLIO_SPAN_BY_ROLE[role];
};

export const normalizeTemplateSpans = (items: PortfolioItem[]): PortfolioItem[] =>
  items.map(item => {
    const normalizedDetailed = item.detailedBlocks?.map(block =>
      shouldNormalizeItemSpan(block)
        ? {
            ...block,
            span: PORTFOLIO_SPAN_BY_ROLE.section,
            layoutRole: "section" as const,
          }
        : block
    );

    if (!shouldNormalizeItemSpan(item)) {
      if (!normalizedDetailed) {
        return item;
      }
      return { ...item, detailedBlocks: normalizedDetailed };
    }

    const role = resolveLayoutRole(item);
    if (!role) {
      return item;
    }

    return {
      ...item,
      span: PORTFOLIO_SPAN_BY_ROLE[role],
      layoutRole: role,
      ...(normalizedDetailed ? { detailedBlocks: normalizedDetailed } : {}),
    };
  });
