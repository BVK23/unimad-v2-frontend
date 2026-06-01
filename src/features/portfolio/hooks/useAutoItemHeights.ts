import { useCallback, useEffect, useRef } from "react";
import { getDefaultItemHeightPx } from "@/features/portfolio/constants/portfolioLayout";
import type { PortfolioItem } from "@/types";

const HEIGHT_GROW_THRESHOLD_PX = 2;
const MAX_AUTO_HEIGHT_PX = 1200;

type UseAutoItemHeightsOptions = {
  items: PortfolioItem[];
  onUpdateHeight: (id: string, height: number) => void;
  resizingId: string | null;
};

export const useAutoItemHeights = ({ items, onUpdateHeight, resizingId }: UseAutoItemHeightsOptions) => {
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleMeasureContentHeight = useCallback(
    (id: string, measuredHeight: number) => {
      if (resizingId === id) return;

      const item = itemsRef.current.find(entry => entry.id === id);
      if (!item) return;
      if (item.heightUserSet) return;
      if (item.type === "text" && item.isCollapsible && item.isCollapsed) return;

      const storedHeight = item.height ?? getDefaultItemHeightPx(item.type);
      const nextHeight = Math.max(
        item.type === "link-box" ? 36 : item.type === "text" ? 80 : 96,
        Math.min(MAX_AUTO_HEIGHT_PX, Math.ceil(measuredHeight))
      );

      if (Math.abs(nextHeight - storedHeight) <= HEIGHT_GROW_THRESHOLD_PX) return;

      onUpdateHeight(id, nextHeight);
    },
    [onUpdateHeight, resizingId]
  );

  return { handleMeasureContentHeight };
};
