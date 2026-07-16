"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import BlockRenderer from "@/components/BlockRenderer";
import DocumentPreviewZoomControls, { DOCUMENT_PREVIEW_ZOOM_DEFAULT } from "@/components/jobs/prepare/DocumentPreviewZoomControls";
import PortfolioImage from "@/components/portfolio/PortfolioImage";
import { fetchVpdContent } from "@/features/vpd/server-actions/vpd-actions";
import { mapVpdApiToStudioProject } from "@/features/vpd/utils/mapVpdApiToStudioProject";
import type { PortfolioItem } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import Link from "next/link";

/** Natural layout width before fit/zoom (Tailwind `max-w-3xl`). */
const VPD_PREVIEW_BASE_WIDTH_PX = 768;
const PREVIEW_PADDING_PX = 32;
const MIN_FIT_SCALE = 0.35;

const isPanExcludedTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(target.closest("a[href], button, input, textarea, select, [role='button'], [data-prepare-preview-zoom]"));

const resetScrollPosition = (el: HTMLDivElement | null) => {
  if (!el) return;
  const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  el.scrollLeft = maxLeft > 0 ? maxLeft / 2 : 0;
  el.scrollTop = 0;
};

const spanToClass = (span?: number): string => {
  const value = Math.max(1, Math.min(12, Number(span) || 12));
  if (value >= 12) return "col-span-12";
  if (value >= 8) return "col-span-12 md:col-span-8";
  if (value >= 6) return "col-span-12 md:col-span-6";
  return "col-span-12 md:col-span-4";
};

interface PrepareApplicationVpdPreviewProps {
  vpdId: string;
  editHref?: string | null;
  onEditVpd?: () => void;
}

/**
 * Prepare-modal VPD preview.
 * Zoom 100% = fit-to-panel width (same idea as cover letter / resume), not raw 768px CSS.
 * Zoom >100% scales from top-left inside a shell sized to the visual bounds so nothing is clipped.
 */
const PrepareApplicationVpdPreview: React.FC<PrepareApplicationVpdPreviewProps> = ({ vpdId, editHref, onEditVpd }) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [userZoom, setUserZoom] = useState(DOCUMENT_PREVIEW_ZOOM_DEFAULT);
  const [fitScale, setFitScale] = useState(1);
  const [pageHeight, setPageHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [contentOverflows, setContentOverflows] = useState(false);

  const vpdQuery = useQuery({
    queryKey: ["vpd", vpdId],
    queryFn: () => fetchVpdContent(vpdId),
    enabled: Boolean(vpdId),
    staleTime: 60 * 1000,
  });

  const project: PortfolioItem | null = vpdQuery.data ? mapVpdApiToStudioProject(vpdQuery.data) : null;
  const blocks = project?.detailedBlocks ?? [];
  const coverUrl = typeof project?.content === "string" ? project.content.trim() : "";
  const hasCover = Boolean(coverUrl);

  const effectiveScale = fitScale * userZoom;
  const scaledWidth = VPD_PREVIEW_BASE_WIDTH_PX * effectiveScale;
  const scaledHeight = pageHeight > 0 ? pageHeight * effectiveScale : undefined;
  const needsHorizontalScroll = viewportWidth > 0 && scaledWidth > viewportWidth - PREVIEW_PADDING_PX + 1;
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
    const viewport = shellRef.current;
    const page = pageRef.current;
    if (!viewport || !page || !project) return;

    const update = () => {
      const width = viewport.clientWidth;
      if (width <= 0) return;
      const nextFit = Math.min(1, (width - PREVIEW_PADDING_PX) / VPD_PREVIEW_BASE_WIDTH_PX);
      const nextFitClamped = Math.max(MIN_FIT_SCALE, nextFit);
      const nextHeight = page.offsetHeight;
      setViewportWidth(prev => (prev === width ? prev : width));
      setFitScale(prev => (Math.abs(prev - nextFitClamped) < 0.001 ? prev : nextFitClamped));
      setPageHeight(prev => (prev === nextHeight ? prev : nextHeight));
      updateOverflowState();
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(page);
    return () => ro.disconnect();
  }, [project, blocks.length, updateOverflowState]);

  useEffect(() => {
    if (!project || pageHeight <= 0) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (userZoom === DOCUMENT_PREVIEW_ZOOM_DEFAULT) {
        resetScrollPosition(el);
      }
      updateOverflowState();
    });
  }, [project, pageHeight, scaledWidth, scaledHeight, userZoom, updateOverflowState]);

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
  const allowHorizontalScroll = userZoom > DOCUMENT_PREVIEW_ZOOM_DEFAULT || needsHorizontalScroll;

  return (
    <div
      ref={shellRef}
      className="group/vpd-preview relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <DocumentPreviewZoomControls userZoom={userZoom} onUserZoomChange={handleUserZoomChange} />

      <div
        ref={scrollRef}
        className={`scrollbar-on-hover min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] ${
          allowHorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden"
        } ${isPanning ? "select-none" : ""} ${panCursorClass}`}
        onPointerDown={handlePanPointerDown}
        onPointerMove={handlePanPointerMove}
        onPointerUp={handlePanPointerEnd}
        onPointerCancel={handlePanPointerEnd}
        onScroll={updateOverflowState}
        aria-label={canDragPan ? "Scroll or drag to pan zoomed VPD preview" : "Scroll VPD preview"}
      >
        {vpdQuery.isLoading && !project ? (
          <div className="flex min-h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : !project ? (
          <div className="flex min-h-full w-full items-center justify-center text-sm text-slate-500">Preview unavailable</div>
        ) : (
          <div
            className={`box-border flex justify-center p-4 ${allowHorizontalScroll ? "w-max min-w-full" : "w-full"}`}
            style={allowHorizontalScroll ? { width: `max(100%, ${Math.ceil(scaledWidth + PREVIEW_PADDING_PX)}px)` } : undefined}
          >
            <div
              className="relative shrink-0 overflow-hidden rounded-lg shadow-md ring-1 ring-slate-200/80 dark:ring-slate-700"
              style={scaledHeight ? { width: scaledWidth, height: scaledHeight } : { width: scaledWidth }}
            >
              <div
                ref={pageRef}
                className="box-border origin-top-left bg-white p-4 dark:bg-slate-900"
                style={{
                  width: VPD_PREVIEW_BASE_WIDTH_PX,
                  transform: `scale(${effectiveScale})`,
                }}
              >
                {!hasCover && project.title ? (
                  <h4 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{project.title}</h4>
                ) : null}
                <div className="pointer-events-none grid grid-cols-12 gap-3">
                  {hasCover ? (
                    <div className="col-span-12">
                      <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <div className="relative aspect-[16/7] w-full bg-slate-100 dark:bg-slate-900">
                          <PortfolioImage
                            src={coverUrl}
                            alt={project.title || "VPD cover"}
                            fill
                            sizes="(max-width: 768px) 100vw, 640px"
                            className="object-cover"
                          />
                          {project.title ? (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent px-3 pb-3 pt-8">
                              <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">{project.title}</p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {blocks.map(block => (
                    <div key={block.id} className={spanToClass(block.span)}>
                      <div className="rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                        <BlockRenderer item={block} isEditMode={false} onUpdate={() => {}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editHref && project ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/vpd-preview:opacity-100">
          <Link
            href={editHref}
            onClick={() => onEditVpd?.()}
            className="pointer-events-auto inline-flex translate-y-3 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 group-hover/vpd-preview:translate-y-0"
          >
            <Pencil size={15} />
            Edit VPD
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default PrepareApplicationVpdPreview;
