"use client";

import React from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

export const DOCUMENT_PREVIEW_ZOOM_MIN = 0.5;
export const DOCUMENT_PREVIEW_ZOOM_MAX = 1.75;
export const DOCUMENT_PREVIEW_ZOOM_STEP = 0.1;
export const DOCUMENT_PREVIEW_ZOOM_DEFAULT = 1;

type DocumentPreviewZoomControlsProps = {
  userZoom: number;
  onUserZoomChange: (zoom: number) => void;
};

const clampZoom = (value: number) => Math.min(DOCUMENT_PREVIEW_ZOOM_MAX, Math.max(DOCUMENT_PREVIEW_ZOOM_MIN, Number(value.toFixed(2))));

const DocumentPreviewZoomControls = React.forwardRef<HTMLDivElement, DocumentPreviewZoomControlsProps>(function DocumentPreviewZoomControls(
  { userZoom, onUserZoomChange },
  ref
) {
  return (
    <div
      ref={ref}
      data-prepare-preview-zoom
      className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90"
    >
      <button
        type="button"
        onClick={() => onUserZoomChange(clampZoom(userZoom - DOCUMENT_PREVIEW_ZOOM_STEP))}
        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <span className="min-w-[3ch] select-none text-center font-mono text-xs text-slate-600 dark:text-slate-300">
        {Math.round(userZoom * 100)}%
      </span>
      <button
        type="button"
        onClick={() => onUserZoomChange(clampZoom(userZoom + DOCUMENT_PREVIEW_ZOOM_STEP))}
        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-600" />
      <button
        type="button"
        onClick={() => onUserZoomChange(DOCUMENT_PREVIEW_ZOOM_DEFAULT)}
        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Reset zoom"
        aria-label="Reset zoom"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
});

export default DocumentPreviewZoomControls;
