"use client";

import { useState } from "react";
import ResumePDFPreview from "@/components/ResumePDFPreview";
import type { ResumeData } from "@/types";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { getTemplate } from "./templates";

type PublicResumeViewProps = {
  data: ResumeData;
};

const PublicResumeView = ({ data }: PublicResumeViewProps) => {
  const [previewScale, setPreviewScale] = useState(0.8);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setPreviewScale(prev => Math.min(2.5, Math.max(0.3, prev + (delta > 0 ? 0.1 : -0.1))));
    }
  };

  if (!getTemplate(data.templateId)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <p className="text-slate-700 text-center">This resume uses a template that is not available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 relative">
      {isPdfLoading ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-100 dark:bg-slate-950 px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-hidden />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading resume…</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center max-w-sm">
            Preparing your PDF preview. This usually takes a few seconds.
          </p>
        </div>
      ) : null}

      {!isPdfLoading ? (
        <div className="absolute top-4 right-4 md:right-8 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm rounded-full p-1.5 z-10 transition-all hover:shadow-md">
          <button
            type="button"
            onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} aria-hidden />
          </button>
          <span className="text-slate-600 dark:text-slate-300 font-mono text-xs min-w-[3ch] text-center select-none tabular-nums">
            {Math.round(previewScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setPreviewScale(s => Math.min(2.5, s + 0.1))}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} aria-hidden />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" aria-hidden />
          <button
            type="button"
            onClick={() => setPreviewScale(0.8)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Reset Zoom"
            aria-label="Reset zoom to 80 percent"
          >
            <RotateCcw size={16} aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="min-h-screen overflow-y-auto py-8 pt-16 px-4 flex justify-center" onWheel={handleWheel} aria-hidden={isPdfLoading}>
        <div className="max-w-5xl w-full flex justify-center">
          <div
            className="transition-all duration-300 origin-top"
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "top center",
            }}
          >
            <ResumePDFPreview
              data={data}
              loadingLabel="Loading resume…"
              errorLabel="Unable to display this resume"
              onLoadingChange={setIsPdfLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicResumeView;
