"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { A4_WIDTH_PX, APPLICATION_DOCUMENT_PAGE_SURFACE_CLASS } from "@/constants/applicationDocumentPreview";

/** A4 margins (~53px) — literal classes here so Tailwind always includes them. */
const PAGE_PADDING_CLASS = "box-border p-[53px]";

/** Match PrepareApplicationResumePreview scale-to-fit behaviour. */
const PREVIEW_PADDING_PX = 24;
const MIN_SCALE = 0.35;
const MAX_SCALE = 1;

type ApplicationDocumentPageFrameProps = {
  variant: "studio" | "compact";
  children: ReactNode;
  /** Toolbar / chrome rendered above the page (studio card header). */
  header?: ReactNode;
  className?: string;
  /** Multiplier applied on top of compact auto fit-to-width scale. */
  userZoom?: number;
  /** When true, the parent owns scrolling (Prepare Application modal). */
  externalScroll?: boolean;
};

/**
 * A4 page frame for cover letter / cold email previews.
 * - studio: full width up to 210mm, scrollable body
 * - compact: scale-to-fit for narrow containers (Prepare modal)
 */
export function ApplicationDocumentPageFrame({
  variant,
  children,
  header,
  className = "",
  userZoom = 1,
  externalScroll = false,
}: ApplicationDocumentPageFrameProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.55);
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    if (variant !== "compact") return;

    const viewport = viewportRef.current;
    const page = pageRef.current;
    if (!viewport || !page) return;

    const update = () => {
      const width = viewport.clientWidth;
      if (width <= 0) return;
      const fitScale = Math.min(MAX_SCALE, (width - PREVIEW_PADDING_PX) / A4_WIDTH_PX);
      setScale(Math.max(MIN_SCALE, fitScale) * userZoom);
      setPageHeight(page.offsetHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(page);
    return () => ro.disconnect();
  }, [variant, children, userZoom]);

  if (variant === "studio") {
    return (
      <div
        className={`mx-auto flex w-[210mm] max-w-full flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-lg dark:border-slate-300 dark:bg-white ${className}`}
      >
        {header}
        <div className="min-h-[297mm] w-full border-t border-slate-100 dark:border-slate-200">
          <div className={`${PAGE_PADDING_CLASS} min-h-[calc(297mm-106px)]`}>{children}</div>
        </div>
      </div>
    );
  }

  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = pageHeight > 0 ? pageHeight * scale : undefined;
  const viewportClassName = externalScroll
    ? `w-full min-w-0 bg-slate-100 dark:bg-slate-900/50 ${className}`
    : `scrollbar-on-hover flex h-full min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-900/50 ${className}`;

  return (
    <div ref={viewportRef} className={viewportClassName}>
      <div className="flex w-full min-w-0 justify-center py-4">
        <div
          className="relative shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-slate-200/80 dark:ring-slate-700"
          style={scaledHeight ? { width: scaledWidth, height: scaledHeight } : { width: scaledWidth }}
        >
          <div
            ref={pageRef}
            className="box-border shrink-0 origin-top-left"
            style={{
              width: A4_WIDTH_PX,
              transform: `scale(${scale})`,
            }}
          >
            <div className={APPLICATION_DOCUMENT_PAGE_SURFACE_CLASS}>
              <div className={PAGE_PADDING_CLASS}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
