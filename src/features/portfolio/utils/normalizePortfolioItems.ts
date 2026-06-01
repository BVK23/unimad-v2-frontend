import { getDefaultItemHeightPx } from "@/features/portfolio/constants/portfolioLayout";
import type { PortfolioItem } from "@/types";

const COMPACT_ITEM_TYPES = new Set<PortfolioItem["type"]>(["link-box"]);

export const normalizePortfolioItem = (item: PortfolioItem): PortfolioItem => {
  const legacySpanMap: Record<number, number> = {
    1: 4,
    2: 8,
    3: 12,
  };
  const mapped = legacySpanMap[item.span as number] ?? (item.span as number);
  const normalizedSpan = Math.max(1, Math.min(12, mapped));
  const defaultHeight = getDefaultItemHeightPx(item.type);
  let height = item.height ?? defaultHeight;

  if (!item.heightUserSet && item.type === "link-box" && height > 112) {
    height = defaultHeight;
  } else if (!item.heightUserSet && COMPACT_ITEM_TYPES.has(item.type) && height > defaultHeight * 1.5) {
    height = defaultHeight;
  }

  return {
    ...item,
    span: normalizedSpan as PortfolioItem["span"],
    colStart: item.colStart ? Math.max(1, Math.min(12, Math.round(item.colStart))) : item.colStart,
    height,
    detailedBlocks: item.detailedBlocks?.map(normalizePortfolioItem),
  };
};

export const normalizePortfolioItems = (items: PortfolioItem[]): PortfolioItem[] => items.map(normalizePortfolioItem);

export const normalizePortfolioData = <T extends { items: PortfolioItem[] }>(data: T): T => ({
  ...data,
  items: normalizePortfolioItems(data.items),
});
