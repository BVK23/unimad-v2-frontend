import type { PortfolioItem } from "@/types";

export const EDGE_RESIZE_HIT_AREA_PX = 18;

export type PortfolioEdgeResizeZone = {
  nearLeft: boolean;
  nearRight: boolean;
  nearTop: boolean;
  nearBottom: boolean;
};

export const getPortfolioEdgeResizeZone = (
  item: PortfolioItem,
  clientX: number,
  clientY: number,
  rect: DOMRect
): PortfolioEdgeResizeZone => {
  const edgeThreshold = EDGE_RESIZE_HIT_AREA_PX;
  const nearRight = rect.right - clientX <= edgeThreshold;
  const nearLeft = clientX - rect.left <= edgeThreshold;
  const nearTop = false;
  let nearBottom = rect.bottom - clientY <= edgeThreshold;

  if (item.type === "table") {
    nearBottom = false;
  }

  return { nearLeft, nearRight, nearTop, nearBottom };
};

export const getPortfolioEdgeResizeCursor = (zone: PortfolioEdgeResizeZone): string => {
  const { nearLeft, nearRight, nearTop, nearBottom } = zone;
  const nearHorizontal = nearLeft || nearRight;
  const nearVertical = nearTop || nearBottom;

  if (nearHorizontal && nearVertical) return "nwse-resize";
  if (nearVertical) return "ns-resize";
  if (nearHorizontal) return "ew-resize";
  return "default";
};

export const resolvePortfolioEdgeResizeAxis = (
  zone: PortfolioEdgeResizeZone
): { axis: "x" | "y" | "both"; xHandle: "left" | "right"; yHandle: "top" | "bottom" } | null => {
  const { nearLeft, nearRight, nearTop, nearBottom } = zone;
  const nearAnyEdge = nearLeft || nearRight || nearTop || nearBottom;
  if (!nearAnyEdge) return null;

  const axis = (nearLeft || nearRight) && (nearTop || nearBottom) ? "both" : nearTop || nearBottom ? "y" : "x";
  const xHandle = nearLeft ? "left" : "right";
  const yHandle = nearTop ? "top" : "bottom";
  return { axis, xHandle, yHandle };
};

export const isInteractiveResizeTarget = (target: HTMLElement): boolean =>
  Boolean(target.closest('input, textarea, button, select, [contenteditable="true"]'));
