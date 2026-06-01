"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, type RefObject } from "react";
import { registerPortfolioLayoutRemeasure } from "@/features/portfolio/layout/portfolioLayoutRemeasure";
import { measurePortfolioBlockRootHeight } from "@/features/portfolio/utils/measurePortfolioBlockHeight";
import type { PortfolioItem } from "@/types";

type UsePortfolioGridRemeasureOptions = {
  portfolioId: string;
  items: PortfolioItem[];
  itemRefs: RefObject<Record<string, HTMLDivElement | null>>;
  gridRef: RefObject<HTMLDivElement | null>;
  onMeasureContentHeight?: (id: string, height: number) => void;
};

const buildItemsLayoutKey = (items: PortfolioItem[]) =>
  items
    .map(
      item =>
        `${item.id}:${item.type}:${item.heightUserSet ? 1 : 0}:${item.height ?? ""}:${item.content?.length ?? 0}:${item.title ?? ""}:${item.description?.length ?? 0}:${item.isCollapsed ? 1 : 0}`
    )
    .join("|");

export function usePortfolioGridRemeasure({
  portfolioId,
  items,
  itemRefs,
  gridRef,
  onMeasureContentHeight,
}: UsePortfolioGridRemeasureOptions) {
  const itemsLayoutKey = useMemo(() => buildItemsLayoutKey(items), [items]);

  const remeasureAll = useCallback(() => {
    if (!onMeasureContentHeight) return;

    items.forEach(item => {
      if (item.heightUserSet) return;
      if (item.type === "text" && item.isCollapsible && item.isCollapsed) return;

      const host = itemRefs.current?.[item.id];
      if (!host) return;

      const root = host.querySelector("[data-portfolio-block-root]");
      if (!(root instanceof HTMLElement)) return;

      const height = measurePortfolioBlockRootHeight(root);
      if (height > 0) {
        onMeasureContentHeight(item.id, height);
      }
    });
  }, [items, itemRefs, onMeasureContentHeight]);

  useLayoutEffect(() => {
    remeasureAll();
  }, [portfolioId, itemsLayoutKey, remeasureAll]);

  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      if (!cancelled) remeasureAll();
    };

    const raf = requestAnimationFrame(() => requestAnimationFrame(schedule));
    const t1 = window.setTimeout(schedule, 50);
    const t2 = window.setTimeout(schedule, 250);
    const t3 = window.setTimeout(schedule, 600);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [portfolioId, itemsLayoutKey, remeasureAll]);

  useEffect(() => {
    registerPortfolioLayoutRemeasure(remeasureAll);
    return () => registerPortfolioLayoutRemeasure(null);
  }, [remeasureAll]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new ResizeObserver(() => remeasureAll());
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef, remeasureAll]);
}
