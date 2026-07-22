import { getDefaultItemHeightPx, resolvePortfolioLayoutRole } from "@/features/portfolio/constants/portfolioLayout";
import { resolvePortfolioBlockType } from "@/features/portfolio/utils/normalizePortfolioBlockType";
import {
  estimateTitleOnlyTextLayoutHeightPx,
  isTitleOnlyTextItem,
  resolvePortfolioTitleHtmlForItem,
} from "@/features/portfolio/utils/portfolio-html";
import type { PortfolioItem } from "@/types";

const COMPACT_ITEM_TYPES = new Set<PortfolioItem["type"]>(["link-box"]);

/**
 * Options for portfolio normalization.
 * `clampTitleOnlyHeights` is only safe on load/replace paths (server data, create, seed).
 * It must NOT run on per-edit `updatePortfolio` calls, otherwise it fights the edit-mode
 * auto-height measurement (empty content editor measures ~160) and causes an update loop.
 */
type NormalizePortfolioOptions = {
  clampTitleOnlyHeights?: boolean;
  /** On load: wrap template section/entry titles in h1/h2 so the editor toolbar matches preview. */
  normalizeTemplateTitleHeadings?: boolean;
};

export const normalizePortfolioItem = (item: PortfolioItem, options: NormalizePortfolioOptions = {}): PortfolioItem => {
  const legacySpanMap: Record<number, number> = {
    1: 4,
    2: 8,
    3: 12,
  };
  const mapped = legacySpanMap[item.span as number] ?? (item.span as number);
  const normalizedSpan = Math.max(1, Math.min(12, mapped));
  const defaultHeight = getDefaultItemHeightPx(item.type);
  let height = item.height ?? defaultHeight;

  if (item.type === "link-box" && height > 112 && item.heightUserSet !== true) {
    height = defaultHeight;
  } else if (COMPACT_ITEM_TYPES.has(item.type) && height > defaultHeight * 1.5 && item.heightUserSet !== true) {
    height = defaultHeight;
  } else if (options.clampTitleOnlyHeights && item.heightUserSet !== true && isTitleOnlyTextItem(item)) {
    const estimate = estimateTitleOnlyTextLayoutHeightPx(item);
    if (height < estimate) height = estimate;
    else if (height > estimate * 1.25) height = estimate;
  }

  const type = resolvePortfolioBlockType(item);
  const resolvedTitle =
    options.normalizeTemplateTitleHeadings && item.type === "text" ? (resolvePortfolioTitleHtmlForItem(item) ?? item.title) : item.title;
  const normalizedItem: PortfolioItem = {
    ...item,
    type,
    title: resolvedTitle,
    span: normalizedSpan as PortfolioItem["span"],
    colStart: item.colStart ? Math.max(1, Math.min(12, Math.round(item.colStart))) : item.colStart,
    height,
    ...(item.heightUserSet === true ? { heightUserSet: true as const } : {}),
    detailedBlocks: item.detailedBlocks?.map(child => normalizePortfolioItem(child, options)),
  };
  const layoutRole = item.layoutRole ?? resolvePortfolioLayoutRole(normalizedItem) ?? undefined;

  return layoutRole ? { ...normalizedItem, layoutRole } : normalizedItem;
};

export const normalizePortfolioItems = (items: PortfolioItem[], options: NormalizePortfolioOptions = {}): PortfolioItem[] =>
  items.map(item => normalizePortfolioItem(item, options));

export const normalizePortfolioData = <T extends { items: PortfolioItem[] }>(data: T, options: NormalizePortfolioOptions = {}): T => ({
  ...data,
  items: normalizePortfolioItems(data.items, options),
});
