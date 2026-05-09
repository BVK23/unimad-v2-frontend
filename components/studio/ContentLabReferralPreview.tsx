"use client";

import { useState } from "react";
import AssetPreviewLoadingOverlay from "@/components/studio/AssetPreviewLoadingOverlay";
import CoverLetterInlineEditor from "@/components/studio/CoverLetterInlineEditor";
import type { ReferralAsset } from "@/features/referral/types";
import { htmlToPlainText } from "@/utils/html-to-text";
import { Copy } from "lucide-react";

interface ContentLabReferralPreviewProps {
  draft: ReferralAsset | null;
  onCopy: () => void;
  copyFeedback: boolean;
  onEditorActivate?: () => void;
  onEditorDeactivate?: () => void;
  onDraftContentChange?: (content: string) => void;
  isGenerating?: boolean;
}

export default function ContentLabReferralPreview({
  draft,
  onCopy,
  copyFeedback,
  onEditorActivate,
  onEditorDeactivate,
  onDraftContentChange,
  isGenerating = false,
}: ContentLabReferralPreviewProps) {
  const [editorValue, setEditorValue] = useState("");
  const content = editorValue || draft?.content || "";
  const hasContent = htmlToPlainText(content).trim().length > 0;
  const showActions = !isGenerating && hasContent;

  const handleCopy = () => {
    if (!hasContent) return;
    const text = htmlToPlainText(content);
    navigator.clipboard.writeText(text).then(() => onCopy());
  };

  const handleEditorChange = (val: string) => {
    setEditorValue(val);
    if (onDraftContentChange) onDraftContentChange(val);
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg w-full max-w-xl mx-auto flex flex-col min-h-[600px]">
      <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-end items-center gap-2">
        {showActions && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy referral request to clipboard"
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Copy size={14} />
            {copyFeedback ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      <div className={`${isGenerating ? "flex-1 overflow-hidden" : "flex-1 p-6 md:p-12 overflow-y-auto"}`}>
        {isGenerating ? (
          <AssetPreviewLoadingOverlay label="Generating referral request..." />
        ) : hasContent ? (
          <CoverLetterInlineEditor
            key={String(draft?.id ?? "referral-empty")}
            value={content}
            onChange={handleEditorChange}
            onActivate={onEditorActivate}
            onDeactivate={onEditorDeactivate}
          />
        ) : (
          <p className="text-slate-400 dark:text-slate-600 font-serif">Your referral request draft will appear here....</p>
        )}
      </div>
    </div>
  );
}
