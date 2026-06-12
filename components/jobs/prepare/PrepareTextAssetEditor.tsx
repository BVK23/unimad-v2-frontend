"use client";

import React, { useEffect, useState } from "react";
import { ApplicationDocumentPageFrame } from "@/components/application-assets/ApplicationDocumentPageFrame";
import CoverLetterInlineEditor from "@/components/studio/CoverLetterInlineEditor";
import { useColdEmail } from "@/features/cold-email/hooks/useColdEmail";
import { useCoverLetter } from "@/features/cover-letter/hooks/useCoverLetter";
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface PrepareTextAssetEditorProps {
  kind: "cover-letter" | "cold-email";
  assetId: string;
  content: string;
  onContentChange: (value: string, options?: { hydrate?: boolean }) => void;
  onSave: () => void;
}

const PrepareTextAssetEditor: React.FC<PrepareTextAssetEditorProps> = ({ kind, assetId, content, onContentChange, onSave }) => {
  const coverQuery = useCoverLetter(kind === "cover-letter" ? assetId : null);
  const coldQuery = useColdEmail(kind === "cold-email" ? assetId : null);
  const query = kind === "cover-letter" ? coverQuery : coldQuery;
  const displayContent = content.trim() || query.data?.content || "";
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const fetched = query.data?.content?.trim();
    if (!fetched || content.trim()) return;
    onContentChange(fetched, { hydrate: true });
  }, [query.data?.content, content, onContentChange]);

  if (query.isLoading && !displayContent.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
        <button
          type="button"
          onClick={() => setPreviewScale(s => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
        <span className="min-w-[3ch] select-none text-center font-mono text-xs text-slate-600 dark:text-slate-300">
          {Math.round(previewScale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setPreviewScale(s => Math.min(1.75, Number((s + 0.1).toFixed(2))))}
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-600" />
        <button
          type="button"
          onClick={() => setPreviewScale(1)}
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          title="Reset zoom"
          aria-label="Reset zoom"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="scrollbar-on-hover min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="p-4" style={{ zoom: previewScale }}>
          <ApplicationDocumentPageFrame
            variant="compact"
            className="min-h-0 min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <CoverLetterInlineEditor value={displayContent} onChange={onContentChange} onDeactivate={onSave} />
          </ApplicationDocumentPageFrame>
        </div>
      </div>
    </div>
  );
};

export default PrepareTextAssetEditor;
