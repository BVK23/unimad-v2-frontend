"use client";

import { useCallback, useState } from "react";

type UsePortfolioContentHeightsOptions = {
  /** When true, only updates local contentHeights (e.g. ADK preview) without side effects. */
  enabled?: boolean;
};

export const usePortfolioContentHeights = ({ enabled = true }: UsePortfolioContentHeightsOptions = {}) => {
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  const handleContentHeightMeasure = useCallback(
    (id: string, measuredHeight: number) => {
      if (!enabled) return;
      setContentHeights(prev => {
        const nextHeight = Math.ceil(measuredHeight);
        if (prev[id] !== undefined && Math.abs(prev[id] - nextHeight) < 1) return prev;
        return { ...prev, [id]: nextHeight };
      });
    },
    [enabled]
  );

  return { contentHeights, handleContentHeightMeasure, setContentHeights };
};
