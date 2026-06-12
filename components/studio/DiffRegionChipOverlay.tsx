"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { Check, Undo2 } from "lucide-react";

export type DiffRegionChipPlacement = {
  regionId: string;
  top: number;
  left: number;
  index: number;
  total: number;
};

type DiffRegionChipOverlayProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  regionIds: string[];
  decisions: Record<string, "keep" | "undo">;
  onKeep: (regionId: string) => void;
  onUndo: (regionId: string) => void;
  busy?: boolean;
  layoutKey: string;
};

const CHIP_WIDTH = 148;
const CHIP_HEIGHT = 32;
const CHIP_INSET = 8;

const getScrollableAncestors = (element: HTMLElement): HTMLElement[] => {
  const scrollables: HTMLElement[] = [];
  let current: HTMLElement | null = element;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight + 1) {
      scrollables.push(current);
    }
    current = current.parentElement;
  }

  return scrollables;
};

const measurePlacements = (
  container: HTMLDivElement,
  regionIds: string[],
  decisions: Record<string, "keep" | "undo">
): DiffRegionChipPlacement[] => {
  const pending = regionIds.filter(id => !decisions[id]);
  if (pending.length === 0) return [];

  const containerRect = container.getBoundingClientRect();
  const maxLeft = container.clientWidth - CHIP_WIDTH - CHIP_INSET;
  const placements: DiffRegionChipPlacement[] = [];

  pending.forEach((regionId, index) => {
    const el = container.querySelector(`[data-diff-region="${regionId}"]`) as HTMLElement | null;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const top = elRect.bottom - containerRect.top + container.scrollTop - CHIP_HEIGHT - CHIP_INSET;
    const left = Math.min(
      maxLeft,
      Math.max(CHIP_INSET, elRect.right - containerRect.left + container.scrollLeft - CHIP_WIDTH - CHIP_INSET)
    );

    placements.push({
      regionId,
      top: Math.max(CHIP_INSET, top),
      left,
      index: index + 1,
      total: pending.length,
    });
  });

  return placements;
};

const DiffRegionChipOverlay = ({
  scrollContainerRef,
  regionIds,
  decisions,
  onKeep,
  onUndo,
  busy = false,
  layoutKey,
}: DiffRegionChipOverlayProps) => {
  const [placements, setPlacements] = useState<DiffRegionChipPlacement[]>([]);

  const updatePlacements = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      setPlacements([]);
      return;
    }
    setPlacements(measurePlacements(container, regionIds, decisions));
  }, [scrollContainerRef, regionIds, decisions]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => updatePlacements();
    const raf = requestAnimationFrame(onScroll);
    const scrollTargets = Array.from(new Set([container, ...getScrollableAncestors(container)]));

    scrollTargets.forEach(target => target.addEventListener("scroll", onScroll, { passive: true }));
    window.addEventListener("resize", onScroll);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onScroll) : null;
    ro?.observe(container);

    const t = window.setTimeout(onScroll, 50);

    return () => {
      cancelAnimationFrame(raf);
      scrollTargets.forEach(target => target.removeEventListener("scroll", onScroll));
      window.removeEventListener("resize", onScroll);
      ro?.disconnect();
      window.clearTimeout(t);
    };
  }, [scrollContainerRef, updatePlacements, layoutKey]);

  if (placements.length === 0) {
    return null;
  }

  return (
    <>
      {placements.map(p => (
        <div
          key={p.regionId}
          role="toolbar"
          aria-label={`Review change ${p.index} of ${p.total}`}
          className="pointer-events-auto absolute z-30 flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900 px-1.5 py-1 shadow-lg dark:border-slate-600 dark:bg-slate-950"
          style={{ top: p.top, left: p.left, width: CHIP_WIDTH }}
          onMouseDown={e => e.preventDefault()}
        >
          {p.total > 1 ? (
            <span className="shrink-0 px-1 text-[9px] font-medium tabular-nums text-slate-400">
              {p.index}/{p.total}
            </span>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => onUndo(p.regionId)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Undo this change"
          >
            <Undo2 size={11} aria-hidden />
            Undo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onKeep(p.regionId)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            aria-label="Keep this change"
          >
            <Check size={11} aria-hidden />
            Keep
          </button>
        </div>
      ))}
    </>
  );
};

export default DiffRegionChipOverlay;
