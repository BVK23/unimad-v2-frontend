"use client";

import React, { useEffect, useRef } from "react";
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
  const hydratedRef = useRef(false);

  const displayContent = content.trim() || query.data?.content || "";

  useEffect(() => {
    const fetched = query.data?.content;
    if (!fetched?.trim() || hydratedRef.current) return;
    hydratedRef.current = true;
    if (!content.trim()) {
      onContentChange(fetched);
    }
  }, [query.data?.content, content, onContentChange]);

  if (query.isLoading && !displayContent.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#111]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="scrollbar-on-hover flex h-full min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-[#111]">
      <div className="min-h-0 w-full flex-1">
        <CoverLetterInlineEditor value={displayContent} onChange={onContentChange} onDeactivate={onSave} />
      </div>
    </div>
  );
};

export default PrepareTextAssetEditor;
