"use client";

import React, { useEffect, useRef, useState } from "react";
import { ApplicationDocumentPageFrame } from "@/components/application-assets/ApplicationDocumentPageFrame";
import CoverLetterInlineEditor from "@/components/studio/CoverLetterInlineEditor";
import { useColdEmail } from "@/features/cold-email/hooks/useColdEmail";
import { useCoverLetter } from "@/features/cover-letter/hooks/useCoverLetter";
import { Loader2 } from "lucide-react";
import DocumentPreviewZoomControls, { DOCUMENT_PREVIEW_ZOOM_DEFAULT } from "./DocumentPreviewZoomControls";

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
  const [userZoom, setUserZoom] = useState(DOCUMENT_PREVIEW_ZOOM_DEFAULT);
  const zoomControlsRef = useRef<HTMLDivElement>(null);

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
      <DocumentPreviewZoomControls ref={zoomControlsRef} userZoom={userZoom} onUserZoomChange={setUserZoom} />

      {/* scrollbar-gutter:stable keeps clientWidth fixed when the 100% zoom page
          overflows — without it, scrollbar appear/disappear thrash ResizeObserver
          fit-scale and the preview flickers between two layouts. */}
      <div className="scrollbar-on-hover [scrollbar-gutter:stable] min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50">
        <ApplicationDocumentPageFrame
          variant="compact"
          userZoom={userZoom}
          externalScroll
          className="border-0 bg-transparent dark:bg-transparent"
        >
          <CoverLetterInlineEditor
            value={displayContent}
            onChange={onContentChange}
            onDeactivate={onSave}
            compactPreview
            deactivateIgnoreRefs={[zoomControlsRef]}
          />
        </ApplicationDocumentPageFrame>
      </div>
    </div>
  );
};

export default PrepareTextAssetEditor;
