"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ResizablePanelWidthOptions = {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  /** Hard cap in pixels. */
  maxWidthPx: number;
  /** Optional viewport fraction cap (0–1), applied as min(maxWidthPx, vw * fraction). */
  maxViewportFraction?: number;
};

function clampWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveMaxWidth(maxWidthPx: number, maxViewportFraction?: number) {
  if (typeof window === "undefined") return maxWidthPx;
  const vwCap = maxViewportFraction != null ? Math.round(window.innerWidth * maxViewportFraction) : Infinity;
  return Math.min(maxWidthPx, vwCap);
}

export function useResizablePanelWidth({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidthPx,
  maxViewportFraction,
}: ResizablePanelWidthOptions) {
  const maxRef = useRef({ maxWidthPx, maxViewportFraction });
  maxRef.current = { maxWidthPx, maxViewportFraction };

  const getMax = useCallback(() => {
    const { maxWidthPx: px, maxViewportFraction: frac } = maxRef.current;
    return resolveMaxWidth(px, frac);
  }, []);

  const widthRef = useRef(defaultWidth);
  const [width, setWidth] = useState(() => clampWidth(defaultWidth, minWidth, resolveMaxWidth(maxWidthPx, maxViewportFraction)));
  const [isResizing, setIsResizing] = useState(false);

  const applyWidth = useCallback(
    (next: number) => {
      const clamped = clampWidth(next, minWidth, getMax());
      setWidth(clamped);
      widthRef.current = clamped;
      return clamped;
    },
    [minWidth, getMax]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) {
          applyWidth(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, [storageKey]);

  useEffect(() => {
    const onResize = () => {
      setWidth(w => {
        const next = clampWidth(w, minWidth, getMax());
        widthRef.current = next;
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minWidth, getMax]);

  const skipInitialPersist = useRef(true);
  useEffect(() => {
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      /* ignore */
    }
  }, [storageKey, width]);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const startResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      setIsResizing(true);
      const startX = event.clientX;
      const startW = widthRef.current;

      const cleanup = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizing(false);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      };

      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX;
        applyWidth(startW + delta);
      };

      const onUp = () => cleanup();

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [applyWidth]
  );

  return { width, isResizing, startResize };
}
