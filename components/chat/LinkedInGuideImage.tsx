"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, X } from "lucide-react";

export type LinkedInGuideSlide = {
  src: string;
  label: string;
  alt?: string;
};

type LinkedInGuideImageProps = {
  /** Single-image mode (headline, cover, etc.) */
  src?: string;
  /** Multi-step guide (About: open section → paste in modal) */
  slides?: LinkedInGuideSlide[];
  alt?: string;
  caption?: string;
};

function normalizeSlides(props: LinkedInGuideImageProps): LinkedInGuideSlide[] {
  if (props.slides?.length) return props.slides;
  if (props.src?.trim()) {
    return [{ src: props.src.trim(), label: "Guide", alt: props.alt }];
  }
  return [];
}

export function LinkedInGuideImage({ src, slides: slidesProp, alt = "Where to edit on LinkedIn", caption }: LinkedInGuideImageProps) {
  const slides = useMemo(() => normalizeSlides({ src, slides: slidesProp, alt }), [src, slidesProp, alt]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const multi = slides.length > 1;

  const close = useCallback(() => {
    setOpen(false);
    setZoom(1);
    setActiveIndex(0);
  }, []);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setZoom(1);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (multi && e.key === "ArrowLeft") setActiveIndex(i => (i > 0 ? i - 1 : slides.length - 1));
      if (multi && e.key === "ArrowRight") setActiveIndex(i => (i < slides.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, multi, open, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[activeIndex] ?? slides[0];
  const activeAlt = active.alt ?? alt;

  return (
    <>
      <div className="mt-2">
        {multi ? (
          <div className="grid grid-cols-2 gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={`${slide.src}-${index}`}
                type="button"
                onClick={() => openAt(index)}
                className="group relative overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                aria-label={`Expand guide step ${index + 1}: ${slide.label}`}
              >
                <img
                  src={slide.src}
                  alt={slide.alt ?? slide.label}
                  className="max-h-24 w-full object-contain object-top transition-opacity group-hover:opacity-90"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  {index + 1}
                </span>
                <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                  <Maximize2 size={10} />
                  Expand
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="group relative block w-full overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            aria-label="Expand LinkedIn guide image"
          >
            <img
              src={slides[0].src}
              alt={slides[0].alt ?? alt}
              className="max-h-40 w-full object-contain transition-opacity group-hover:opacity-90"
              onError={e => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Maximize2 size={12} />
              Expand
            </span>
          </button>
        )}
        {caption ? (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {multi ? "Tap either image to expand — use arrows in the preview to switch steps." : caption}
          </p>
        ) : null}
      </div>

      <ModalPortalOverlay
        open={open}
        className="flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="LinkedIn guide image preview"
      >
        <div
          className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-2">
              {multi ? (
                <button
                  type="button"
                  onClick={() => setActiveIndex(i => (i > 0 ? i - 1 : slides.length - 1))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Previous guide step"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {multi ? `${activeIndex + 1}/${slides.length} · ${active.label}` : activeAlt}
              </p>
              {multi ? (
                <button
                  type="button"
                  onClick={() => setActiveIndex(i => (i < slides.length - 1 ? i + 1 : 0))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Next guide step"
                >
                  <ChevronRight size={18} />
                </button>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Zoom out"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-[3rem] text-center text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Zoom in"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={close}
                className="ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="scrollbar-on-hover min-h-0 flex-1 overflow-auto p-4">
            <img
              src={active.src}
              alt={activeAlt}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              className="mx-auto block max-w-full transition-transform duration-150"
            />
          </div>
        </div>
      </ModalPortalOverlay>
    </>
  );
}
