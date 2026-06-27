"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { Check, RotateCcw } from "lucide-react";

export type DiffRegionChipPlacement = {
  regionId: string;
  top: number;
  left: number;
};

type DiffRegionChipOverlayProps = {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  regionIds: string[];
  decisions: Record<string, "keep" | "undo">;
  activeRegionId: string | null;
  hoveredRegionId?: string | null;
  onHoverRegionChange?: (regionId: string | null) => void;
  onKeep: (regionId: string) => void;
  onUndo: (regionId: string) => void;
  busy?: boolean;
  layoutKey: string;
};

const PILL_WIDTH = 72;
const PILL_HEIGHT = 36;
/** Overlap the pill onto the region top so the cursor path from block → pill stays interactive. */
const PILL_OVERLAP = 12;

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
  const placements: DiffRegionChipPlacement[] = [];

  pending.forEach(regionId => {
    const el = container.querySelector(`[data-diff-region="${regionId}"]`) as HTMLElement | null;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const centerLeft = elRect.left - containerRect.left + container.scrollLeft + elRect.width / 2 - PILL_WIDTH / 2;
    const top = elRect.top - containerRect.top + container.scrollTop - PILL_HEIGHT + PILL_OVERLAP;

    placements.push({
      regionId,
      top: Math.max(8, top),
      left: Math.max(8, Math.min(container.clientWidth - PILL_WIDTH - 8, centerLeft)),
    });
  });

  return placements;
};

const isSameInteractionRegion = (regionId: string, relatedTarget: EventTarget | null): boolean => {
  if (!(relatedTarget instanceof HTMLElement)) return false;
  const relatedRegionId =
    relatedTarget.closest("[data-diff-region]")?.getAttribute("data-diff-region") ??
    relatedTarget.closest("[data-diff-pill]")?.getAttribute("data-diff-pill");
  return relatedRegionId === regionId;
};

const DiffRegionChipOverlay = ({
  scrollContainerRef,
  regionIds,
  decisions,
  activeRegionId,
  hoveredRegionId = null,
  onHoverRegionChange,
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
      {placements.map(p => {
        const isActive = p.regionId === activeRegionId;
        const isHovered = p.regionId === hoveredRegionId;
        const isVisible = isActive || isHovered;
        return (
          <div
            key={p.regionId}
            data-diff-pill={p.regionId}
            role="toolbar"
            aria-label="Review this change"
            className={`absolute z-40 ${isVisible ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1"}`}
            style={{ top: p.top - 12, left: p.left - 10, width: PILL_WIDTH + 20, height: PILL_HEIGHT + 20, padding: "12px 10px 8px" }}
            onMouseEnter={() => onHoverRegionChange?.(p.regionId)}
            onMouseLeave={e => {
              if (isSameInteractionRegion(p.regionId, e.relatedTarget)) return;
              onHoverRegionChange?.(null);
            }}
            onMouseDown={e => e.preventDefault()}
          >
            <div className="pointer-events-auto flex h-full w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-md transition-all duration-200 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                disabled={busy}
                onClick={() => onKeep(p.regionId)}
                className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30"
                aria-label="Keep this change"
                title="Keep"
              >
                <Check size={16} />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <button
                type="button"
                disabled={busy}
                onClick={() => onUndo(p.regionId)}
                className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30"
                aria-label="Undo this change"
                title="Undo"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default DiffRegionChipOverlay;
