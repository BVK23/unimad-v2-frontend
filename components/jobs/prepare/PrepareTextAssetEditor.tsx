"use client";

import React, { useEffect } from "react";
import { ApplicationDocumentPageFrame } from "@/components/application-assets/ApplicationDocumentPageFrame";
import CoverLetterInlineEditor from "@/components/studio/CoverLetterInlineEditor";
import { useColdEmail } from "@/features/cold-email/hooks/useColdEmail";
import { useCoverLetter } from "@/features/cover-letter/hooks/useCoverLetter";
import { Loader2 } from "lucide-react";

interface PrepareTextAssetEditorProps {
  kind: "cover-letter" | "cold-email";
  assetId: string;
  content: string;
  onContentChange: (value: string) => void;
  onSave: () => void;
}

const PrepareTextAssetEditor: React.FC<PrepareTextAssetEditorProps> = ({ kind, assetId, content, onContentChange, onSave }) => {
  const coverQuery = useCoverLetter(kind === "cover-letter" ? assetId : null);
  const coldQuery = useColdEmail(kind === "cold-email" ? assetId : null);
  const query = kind === "cover-letter" ? coverQuery : coldQuery;
  const displayContent = content.trim() || query.data?.content || "";

  useEffect(() => {
    const fetched = query.data?.content?.trim();
    if (!fetched || content.trim()) return;
    onContentChange(fetched);
  }, [query.data?.content, content, onContentChange]);

  if (query.isLoading && !displayContent.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ApplicationDocumentPageFrame
        variant="compact"
        className="min-h-0 min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-800"
      >
        <CoverLetterInlineEditor value={displayContent} onChange={onContentChange} onDeactivate={onSave} />
      </ApplicationDocumentPageFrame>
    </div>
  );
};

export default PrepareTextAssetEditor;
