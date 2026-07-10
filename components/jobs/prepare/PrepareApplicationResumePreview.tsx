"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import DocumentPreviewZoomControls, { DOCUMENT_PREVIEW_ZOOM_DEFAULT } from "@/components/jobs/prepare/DocumentPreviewZoomControls";
import { SCALED_A4_PREVIEW_HEIGHT_PX, SCALED_A4_PREVIEW_WIDTH_PX } from "@/components/resume/shared/ScaledA4PreviewShell";
import { getTemplate } from "@/components/resume/templates";
import { useResume } from "@/features/resume/hooks/useResume";
import { useResumesList } from "@/features/resume/hooks/useResumesList";
import type { ResumeData } from "@/types";
import { Loader2, Pencil } from "lucide-react";
import Link from "next/link";

const PREVIEW_PADDING_PX = 24;
const MAX_FIT_SCALE = 0.92;

const isPanExcludedTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest("a[href], button, input, textarea, select, [role='button'], [data-prepare-preview-zoom]"));

/** Default scroll: top-aligned, horizontally centered when the page is wider than the viewport. */
const resetScrollPosition = (el: HTMLDivElement | null) => {
  if (!el) return;
  const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  el.scrollLeft = maxLeft > 0 ? maxLeft / 2 : 0;
  el.scrollTop = 0;
};

interface PrepareApplicationResumePreviewProps {
  resumeId: string;
  editHref?: string | null;
  onEditResume?: () => void;
}

/**
 * Full-width resume preview for the Prepare Application modal.
 * Scales the A4 template to fit the available panel width (not the small dashboard thumbnail).
 */
const PrepareApplicationResumePreview: React.FC<PrepareApplicationResumePreviewProps> = ({ resumeId, editHref, onEditResume }) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [baseFitScale, setBaseFitScale] = useState(0.55);
  const [userZoom, setUserZoom] = useState(DOCUMENT_PREVIEW_ZOOM_DEFAULT);
  const [isPanning, setIsPanning] = useState(false);
  const [contentOverflows, setContentOverflows] = useState(false);
  const { data: resumesList = [] } = useResumesList();
  const resumeQuery = useResume(resumeId);

  const listMeta = resumesList.find(r => r.id === resumeId);
  const resume: ResumeData | undefined = resumeQuery.data ?? listMeta;
  const templateRenderer = resume ? getTemplate(resume.templateId) : null;
  const effectiveScale = baseFitScale * userZoom;

  const scaledWidth = SCALED_A4_PREVIEW_WIDTH_PX * effectiveScale;
  const scaledHeight = SCALED_A4_PREVIEW_HEIGHT_PX * effectiveScale;
  const canDragPan = userZoom > DOCUMENT_PREVIEW_ZOOM_DEFAULT && contentOverflows;

  const updateOverflowState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContentOverflows(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
  }, []);

  const handleUserZoomChange = useCallback((zoom: number) => {
    setUserZoom(zoom);
    if (zoom === DOCUMENT_PREVIEW_ZOOM_DEFAULT) {
      requestAnimationFrame(() => resetScrollPosition(scrollRef.current));
    }
  }, []);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const next = Math.min(MAX_FIT_SCALE, (width - PREVIEW_PADDING_PX) / SCALED_A4_PREVIEW_WIDTH_PX);
      setBaseFitScale(Math.max(0.35, next));
      updateOverflowState();
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateOverflowState]);

  useEffect(() => {
    if (!resume || !templateRenderer) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el || userZoom !== DOCUMENT_PREVIEW_ZOOM_DEFAULT) return;
      resetScrollPosition(el);
      updateOverflowState();
    });
  }, [resume, templateRenderer, scaledWidth, scaledHeight, userZoom, updateOverflowState]);

  const handlePanPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !canDragPan || isPanExcludedTarget(e.target)) return;

    const el = scrollRef.current;
    if (!el) return;

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePanPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;

    const el = scrollRef.current;
    if (!el) return;

    el.scrollLeft = panStartRef.current.scrollLeft - (e.clientX - panStartRef.current.x);
    el.scrollTop = panStartRef.current.scrollTop - (e.clientY - panStartRef.current.y);
  };

  const handlePanPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setIsPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const panCursorClass = canDragPan ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "";

  return (
    <div
      ref={shellRef}
      className="group/resume-preview relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <DocumentPreviewZoomControls userZoom={userZoom} onUserZoomChange={handleUserZoomChange} />

      <div
        ref={scrollRef}
        className={`scrollbar-on-hover min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] ${userZoom > DOCUMENT_PREVIEW_ZOOM_DEFAULT ? "overflow-x-auto" : "overflow-x-hidden"} ${isPanning ? "select-none" : ""} ${panCursorClass}`}
        onPointerDown={handlePanPointerDown}
        onPointerMove={handlePanPointerMove}
        onPointerUp={handlePanPointerEnd}
        onPointerCancel={handlePanPointerEnd}
        onScroll={updateOverflowState}
        aria-label={canDragPan ? "Scroll or drag to pan zoomed resume preview" : "Scroll resume preview"}
      >
        {resumeQuery.isLoading && !resume ? (
          <div className="flex min-h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !resume || !templateRenderer ? (
          <div className="flex min-h-full w-full items-center justify-center text-sm text-slate-500">Preview unavailable</div>
        ) : (
          <div
            className={`relative box-border p-4 ${userZoom > DOCUMENT_PREVIEW_ZOOM_DEFAULT ? "w-max min-w-full" : "w-full"}`}
            style={userZoom > DOCUMENT_PREVIEW_ZOOM_DEFAULT ? { width: `max(100%, ${scaledWidth}px)` } : undefined}
          >
            <div className="relative flex w-full justify-center">
              <div
                className="relative shrink-0 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200/80 dark:ring-slate-700"
                style={{ width: scaledWidth, height: scaledHeight }}
              >
                {templateRenderer.renderPreview(resume, { previewScale: effectiveScale, isModal: false })}

                {editHref ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/resume-preview:opacity-100">
                    <Link
                      href={editHref}
                      onClick={() => onEditResume?.()}
                      className="pointer-events-auto inline-flex translate-y-3 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 group-hover/resume-preview:translate-y-0"
                    >
                      <Pencil size={15} />
                      Edit Resume
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrepareApplicationResumePreview;
