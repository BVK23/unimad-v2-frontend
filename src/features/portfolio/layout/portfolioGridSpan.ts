import {
  DEFAULT_ITEM_HEIGHT_PX,
  getDefaultItemHeightPx,
  PORTFOLIO_BLOCK_GAP_PX,
  PORTFOLIO_GRID_ROW_HEIGHT_PX,
} from "@/features/portfolio/constants/portfolioLayout";
import {
  estimateContentOnlyTextLayoutHeightPx,
  estimateTitleOnlyTextLayoutHeightPx,
  isContentOnlyTextItem,
  isTitleOnlyTextItem,
} from "@/features/portfolio/utils/portfolio-html";
import type { PortfolioItem } from "@/types";

export type PortfolioGridMetrics = {
  rowHeight: number;
  rowGap: number;
};

const BLENDED_HEIGHT_TYPES = new Set<PortfolioItem["type"]>(["text", "table", "page-card", "media"]);

const DEFAULT_BLEND_MIN_HEIGHT_PX = 120;

export type PortfolioGridLayoutOptions = {
  isEditMode?: boolean;
};

const rowSpanForHeightPx = (heightPx: number, rowHeight: number, gap: number): number =>
  Math.max(2, Math.ceil((heightPx + gap) / (rowHeight + gap)));

/** UIUX dense grid class string for 12-column portfolio canvases. */
export const PORTFOLIO_DENSE_GRID_CLASS = "grid grid-cols-1 md:grid-cols-12 gap-6 grid-flow-row-dense auto-rows-[12px]";

export const getBlendedHeightPx = (
  item: PortfolioItem,
  contentHeights: Record<string, number>,
  options: PortfolioGridLayoutOptions = {}
): number => {
  const isEditMode = options.isEditMode ?? true;
  if (!BLENDED_HEIGHT_TYPES.has(item.type)) {
    const measured = contentHeights[item.id];
    return item.height ?? measured ?? getDefaultItemHeightPx(item.type);
  }

  const measured = contentHeights[item.id] ?? 0;
  const stored = item.height;
  const manualFloor = item.heightUserSet === true;
  const titleOnlyHeading = item.type === "text" && isTitleOnlyTextItem(item);
  const contentOnlyBody = item.type === "text" && isContentOnlyTextItem(item);
  const headingEstimate = titleOnlyHeading ? estimateTitleOnlyTextLayoutHeightPx(item) : 0;
  const bodyOnlyEstimate = contentOnlyBody ? estimateContentOnlyTextLayoutHeightPx() : 0;

  if (titleOnlyHeading && !manualFloor) {
    if (!isEditMode) {
      const layoutMeasured = measured > headingEstimate * 1.2 ? headingEstimate : measured;
      if (layoutMeasured > 0) return Math.max(headingEstimate, layoutMeasured);
      return headingEstimate;
    }
    if (measured > 0) return Math.max(DEFAULT_BLEND_MIN_HEIGHT_PX, measured, headingEstimate);
    return Math.max(DEFAULT_BLEND_MIN_HEIGHT_PX, headingEstimate);
  }

  if (contentOnlyBody && !manualFloor) {
    if (!isEditMode) {
      if (measured > 0) return Math.max(bodyOnlyEstimate, measured);
      return bodyOnlyEstimate;
    }
    if (measured > 0) return Math.max(DEFAULT_BLEND_MIN_HEIGHT_PX, measured);
    return DEFAULT_BLEND_MIN_HEIGHT_PX;
  }

  // Template-seeded heights can over-estimate; hug live content unless the user manually resized.
  if (measured > 0 && !manualFloor) {
    return Math.max(DEFAULT_BLEND_MIN_HEIGHT_PX, measured);
  }

  if (stored && measured) return Math.max(stored, measured);
  if (stored) return Math.max(DEFAULT_BLEND_MIN_HEIGHT_PX, stored);
  if (measured) return measured;
  return DEFAULT_BLEND_MIN_HEIGHT_PX;
};

export const getRowSpanForPortfolioItem = (
  item: PortfolioItem,
  contentHeights: Record<string, number>,
  gridMetrics: PortfolioGridMetrics,
  options: PortfolioGridLayoutOptions = {}
): number => {
  const isEditMode = options.isEditMode ?? true;
  const rowHeight = PORTFOLIO_GRID_ROW_HEIGHT_PX;
  const gap = PORTFOLIO_BLOCK_GAP_PX;

  if (BLENDED_HEIGHT_TYPES.has(item.type)) {
    const totalHeight = getBlendedHeightPx(item, contentHeights, options);
    const span = rowSpanForHeightPx(totalHeight, rowHeight, gap);
    const titleOnlyHeading = item.type === "text" && isTitleOnlyTextItem(item);

    if (titleOnlyHeading && !isEditMode && item.heightUserSet !== true) {
      const headingEstimate = estimateTitleOnlyTextLayoutHeightPx(item);
      const headingSpan = rowSpanForHeightPx(headingEstimate, rowHeight, gap);
      if (totalHeight > headingEstimate * 1.15) return span;
      return headingSpan;
    }

    return span;
  }

  const measuredHeight = contentHeights[item.id];
  const heightPx = measuredHeight ?? item.height ?? DEFAULT_ITEM_HEIGHT_PX;
  const minRows = ["text", "table", "page-card", "link-box"].includes(item.type) ? 3 : 8;
  const rowUnit = gridMetrics.rowHeight + gridMetrics.rowGap;
  const span = Math.ceil((heightPx + gridMetrics.rowGap) / Math.max(1, rowUnit));
  return Math.max(minRows, span);
};
