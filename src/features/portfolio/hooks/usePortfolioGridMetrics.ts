"use client";

import { useEffect, useState, type RefObject } from "react";
import { PORTFOLIO_BLOCK_GAP_PX, PORTFOLIO_GRID_ROW_HEIGHT_PX } from "@/features/portfolio/constants/portfolioLayout";
import type { PortfolioGridMetrics } from "@/features/portfolio/layout/portfolioGridSpan";

export const usePortfolioGridMetrics = (gridRef: RefObject<HTMLDivElement | null>) => {
  const [gridMetrics, setGridMetrics] = useState<PortfolioGridMetrics>({
    rowHeight: PORTFOLIO_GRID_ROW_HEIGHT_PX,
    rowGap: PORTFOLIO_BLOCK_GAP_PX,
  });

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;

    const updateGridMetrics = () => {
      const styles = window.getComputedStyle(node);
      const parsedRowGap = Number.parseFloat(styles.rowGap || String(PORTFOLIO_BLOCK_GAP_PX));
      const rowGap = Number.isFinite(parsedRowGap) ? parsedRowGap : PORTFOLIO_BLOCK_GAP_PX;
      setGridMetrics(prev =>
        prev.rowHeight === PORTFOLIO_GRID_ROW_HEIGHT_PX && prev.rowGap === rowGap
          ? prev
          : { rowHeight: PORTFOLIO_GRID_ROW_HEIGHT_PX, rowGap }
      );
    };

    updateGridMetrics();
    const observer = new ResizeObserver(updateGridMetrics);
    observer.observe(node);
    return () => observer.disconnect();
  }, [gridRef]);

  return gridMetrics;
};
