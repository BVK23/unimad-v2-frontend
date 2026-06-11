import { useCallback, useRef, useState } from "react";

/** Default section-input column width (matches legacy `w-[360px]`). */
export const RESUME_FORMS_PANEL_DEFAULT_PX = 360;
export const RESUME_FORMS_PANEL_MIN_PX = 360;
export const RESUME_FORMS_PANEL_MAX_PX = 520;

export function useResumeFormsPanelResize(initialWidth = RESUME_FORMS_PANEL_DEFAULT_PX) {
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelWidthRef = useRef(initialWidth);

  const startResize = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    setIsResizing(true);
    const startX = event.clientX;
    const startW = panelWidthRef.current;

    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };

    const onMove = (ev: PointerEvent) => {
      const next = startW + (ev.clientX - startX);
      const clamped = Math.min(RESUME_FORMS_PANEL_MAX_PX, Math.max(RESUME_FORMS_PANEL_MIN_PX, next));
      setPanelWidth(clamped);
      panelWidthRef.current = clamped;
    };

    const onUp = () => cleanup();

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }, []);

  return { panelWidth, isResizing, startResize };
}
