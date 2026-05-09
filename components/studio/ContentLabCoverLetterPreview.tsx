"use client";

import { useState } from "react";
import AssetPreviewLoadingOverlay from "@/components/studio/AssetPreviewLoadingOverlay";
import CoverLetterInlineEditor from "@/components/studio/CoverLetterInlineEditor";
import { exportCoverLetterAsPDF } from "@/features/cover-letter/hooks/export-cover-letter-pdf";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { htmlToPlainText } from "@/utils/html-to-text";
import { Copy, Download } from "lucide-react";

interface ContentLabCoverLetterPreviewProps {
  draft: CoverLetterAsset | null;
  onCopy: () => void;
  copyFeedback: boolean;
  onEditorActivate?: () => void;
  onEditorDeactivate?: () => void;
  onDraftContentChange?: (content: string) => void;
  isGenerating?: boolean;
}

export default function ContentLabCoverLetterPreview({
  draft,
  onCopy,
  copyFeedback,
  onEditorActivate,
  onEditorDeactivate,
  onDraftContentChange,
  isGenerating = false,
}: ContentLabCoverLetterPreviewProps) {
  const [editorValue, setEditorValue] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const content = editorValue || draft?.content || "";
  const hasContent = content.trim().length > 0;
  const showActions = !isGenerating && hasContent;

  const handleCopy = () => {
    if (!hasContent) return;
    const text = htmlToPlainText(content);
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => onCopy());
  };

  const handleDownload = async () => {
    if (!draft || !hasContent || isDownloading) return;
    setIsDownloading(true);
    try {
      await exportCoverLetterAsPDF({ ...draft, content });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditorChange = (val: string) => {
    setEditorValue(val);
    if (onDraftContentChange) {
      onDraftContentChange(val);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg w-full max-w-xl mx-auto flex flex-col min-h-[600px]">
      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-end items-center gap-2">
        {showActions && (
          <>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy cover letter to clipboard"
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Copy size={14} />
              {copyFeedback ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!draft || isDownloading}
              aria-label="Download cover letter as PDF"
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              {isDownloading ? "Preparing..." : "Download"}
            </button>
          </>
        )}
      </div>
      <div className={`${isGenerating ? "flex-1 overflow-hidden" : "flex-1 p-6 md:p-12 overflow-y-auto"}`}>
        {isGenerating ? (
          <AssetPreviewLoadingOverlay label="Generating cover letter..." />
        ) : hasContent ? (
          <div className="font-serif text-base text-slate-900 dark:text-slate-100" role="textbox" aria-label="Cover letter editor">
            <CoverLetterInlineEditor
              key={String(draft?.id ?? "cover-letter-empty")}
              value={content}
              onChange={handleEditorChange}
              onActivate={onEditorActivate}
              onDeactivate={onEditorDeactivate}
            />
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-600 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-serif">
            Your cover letter draft will appear here....
          </p>
        )}
      </div>
    </div>
  );
}
