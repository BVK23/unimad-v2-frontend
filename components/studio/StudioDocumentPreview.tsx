"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RichTextEditor, { type RichTextEditorSelectionInfo } from "@/components/RichTextEditor";
import AssetPreviewLoadingOverlay from "@/components/studio/AssetPreviewLoadingOverlay";
import DocumentDiffPreview from "@/components/studio/DocumentDiffPreview";
import DocumentPendingRevisionBar from "@/components/studio/DocumentPendingRevisionBar";
import SelectionQuickActions from "@/components/studio/SelectionQuickActions";
import { APPLICATION_ASSET_MIN_SELECTION_CHARS } from "@/features/application-assets/config/selection-presets";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { htmlToPlainText } from "@/utils/html-to-text";
import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";
import { Copy, Download } from "lucide-react";

export type DocumentSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const documentSaveStatusLabel = (status: DocumentSaveStatus | undefined): string => {
  switch (status) {
    case "unsaved":
      return "Unsaved changes";
    case "saving":
      return "Autosaving...";
    case "saved":
      return "All changes saved";
    case "error":
      return "Failed to save";
    default:
      return "";
  }
};

interface StudioDocumentPreviewProps {
  content: string;
  placeholder: string;
  isGenerating?: boolean;
  generatingLabel?: string;
  copyFeedback?: boolean;
  saveStatus?: DocumentSaveStatus;
  onCopy: () => void;
  onContentChange?: (content: string) => void;
  onDownloadPdf?: () => Promise<void>;
  showPdfDownload?: boolean;
  assetType?: ApplicationAssetApiType | null;
  isAdkLoading?: boolean;
  hasPendingRevision?: boolean;
  adkReviewBusy?: boolean;
  onAcceptRevision?: () => void;
  onRevertRevision?: () => void;
  /** Baseline draft HTML for diff view (before ADK revision). */
  baselineDraft?: string;
  /** The text the user selected to anchor the diff. */
  anchorSelectedText?: string;
  /** Called when the user applies a reconciled diff result. */
  onApplyReconciled?: (reconciledHtml: string) => void;
  /** Remount diff review when a new ADK revision arrives. */
  reviewSessionKey?: string;
}

/** Typography on the preview body — matches pre–diff-review Studio preview (commit 3fe2028). */
export const documentPreviewBodyTypography = "font-serif text-base leading-relaxed text-slate-900 dark:text-slate-100";

export const documentPreviewEditorClass =
  "max-w-none min-h-full w-full border-none bg-transparent font-serif text-base leading-relaxed text-slate-900 outline-none dark:text-slate-100 " +
  "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_p]:font-serif " +
  "[&_strong]:font-semibold [&_b]:font-semibold " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:font-serif " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:font-serif " +
  "[&_li]:mb-2 [&_li:last-child]:mb-0 [&_li]:font-serif " +
  "[&_.diff-region-block]:font-serif";

const StudioDocumentPreview = ({
  content,
  placeholder,
  isGenerating = false,
  generatingLabel = "Generating draft...",
  copyFeedback = false,
  saveStatus = "idle",
  onCopy,
  onContentChange,
  onDownloadPdf,
  showPdfDownload = false,
  assetType = null,
  isAdkLoading = false,
  hasPendingRevision = false,
  adkReviewBusy = false,
  onAcceptRevision,
  onRevertRevision,
  baselineDraft = "",
  anchorSelectedText,
  onApplyReconciled,
  reviewSessionKey = "review",
}: StudioDocumentPreviewProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [localContent, setLocalContent] = useState(() => normalizeContentToHtml(content));
  const lastExternalContent = useRef(content);

  const selectedText = useApplicationAssetStudioStore(s => s.selectedText);
  const selectionRect = useApplicationAssetStudioStore(s => s.selectionRect);
  const setSelection = useApplicationAssetStudioStore(s => s.setSelection);
  const clearSelection = useApplicationAssetStudioStore(s => s.clearSelection);

  useEffect(() => {
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      setLocalContent(normalizeContentToHtml(content));
    }
  }, [content]);

  useEffect(() => {
    const onScroll = () => clearSelection();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [clearSelection]);

  const displayContent = normalizeContentToHtml(localContent || content);
  const hasContent = htmlToPlainText(displayContent).trim().length > 0;

  const showDiffView = hasPendingRevision && baselineDraft.trim() && content.trim() && onApplyReconciled;

  useEffect(() => {
    if (showDiffView) {
      clearSelection();
    }
  }, [showDiffView, clearSelection]);

  const showActions = !isGenerating && hasContent;
  const saveStatusLabel = showActions && !hasPendingRevision ? documentSaveStatusLabel(saveStatus) : "";

  const stripDisabled = isAdkLoading || hasPendingRevision;
  const stripDisabledReason = hasPendingRevision
    ? "Accept or revert the current revision first"
    : isAdkLoading
      ? "Unibot is working…"
      : undefined;

  const showQuickActions =
    Boolean(assetType) &&
    Boolean(selectionRect) &&
    selectedText.trim().length >= APPLICATION_ASSET_MIN_SELECTION_CHARS &&
    !isGenerating &&
    hasContent;

  const handleSelectionChange = useCallback(
    (info: RichTextEditorSelectionInfo | null) => {
      if (!info || !info.text.trim() || info.text.trim().length < APPLICATION_ASSET_MIN_SELECTION_CHARS) {
        clearSelection();
        return;
      }
      setSelection(info.text, info.rect);
    },
    [clearSelection, setSelection]
  );

  const handleCopy = () => {
    if (!hasContent) return;
    const text = htmlToPlainText(displayContent);
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => onCopy());
  };

  const handleDownload = async () => {
    if (!onDownloadPdf || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownloadPdf();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChange = (val: string) => {
    setLocalContent(val);
    onContentChange?.(val);
  };

  return (
    <div className="mx-auto flex min-h-[min(68vh,580px)] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-h-[52px] items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
        {saveStatusLabel ? (
          <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400" aria-live="polite">
            {saveStatusLabel}
          </span>
        ) : (
          <span className="flex-1" aria-hidden />
        )}
        {showActions && (
          <div className="flex shrink-0 justify-end gap-2">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Copy size={14} />
              {copyFeedback ? "Copied!" : "Copy"}
            </button>
            {showPdfDownload && onDownloadPdf && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                aria-label="Download as PDF"
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Download size={14} />
                {isDownloading ? "Preparing..." : "Download as PDF"}
              </button>
            )}
          </div>
        )}
      </div>
      {showDiffView ? (
        <div className="relative flex-1 overflow-hidden">
          <DocumentDiffPreview
            key={reviewSessionKey}
            baselineDraft={baselineDraft}
            proposedDraft={content}
            anchorSelectedText={anchorSelectedText}
            onApply={onApplyReconciled}
            onRevertAll={onRevertRevision ?? (() => {})}
            busy={adkReviewBusy}
            editorClassName={documentPreviewEditorClass}
          />
        </div>
      ) : (
        <div className={`relative flex-1 overflow-y-auto ${documentPreviewBodyTypography} ${isGenerating ? "min-h-[320px]" : "p-12"}`}>
          {hasPendingRevision && !showDiffView && assetType && onAcceptRevision && onRevertRevision ? (
            <DocumentPendingRevisionBar
              assetType={assetType}
              busy={adkReviewBusy}
              onAccept={onAcceptRevision}
              onRevert={onRevertRevision}
            />
          ) : null}
          {isGenerating ? (
            <AssetPreviewLoadingOverlay label={generatingLabel} />
          ) : hasContent ? (
            <>
              <RichTextEditor
                value={displayContent}
                onChange={handleChange}
                placeholder={placeholder}
                className={documentPreviewEditorClass}
                onSelectionChange={assetType ? handleSelectionChange : undefined}
                forceExternalSync={hasPendingRevision}
              />
              {showQuickActions && assetType && selectionRect ? (
                <SelectionQuickActions
                  assetType={assetType}
                  selectedText={selectedText}
                  selectionRect={selectionRect}
                  disabled={stripDisabled}
                  disabledReason={stripDisabledReason}
                  onActionFired={clearSelection}
                />
              ) : null}
            </>
          ) : (
            <p className="font-serif text-slate-400 dark:text-slate-600">{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudioDocumentPreview;
