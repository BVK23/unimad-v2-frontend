"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RichTextEditor, { type RichTextEditorSelectionInfo } from "@/components/RichTextEditor";
import { ApplicationAssetDownloadMenu } from "@/components/application-assets/ApplicationAssetDownloadMenu";
import { ApplicationDocumentPageFrame } from "@/components/application-assets/ApplicationDocumentPageFrame";
import { DocumentSaveStatusBar, type DocumentSaveStatusBarVariant } from "@/components/application-assets/DocumentSaveStatusBar";
import AssetPreviewLoadingOverlay from "@/components/studio/AssetPreviewLoadingOverlay";
import DocumentDiffPreview from "@/components/studio/DocumentDiffPreview";
import DocumentPendingRevisionBar from "@/components/studio/DocumentPendingRevisionBar";
import SelectionQuickActions from "@/components/studio/SelectionQuickActions";
import { APPLICATION_DOCUMENT_BODY_CLASS } from "@/constants/applicationDocumentPreview";
import { APPLICATION_ASSET_MIN_SELECTION_CHARS } from "@/features/application-assets/config/selection-presets";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { htmlToPlainText } from "@/utils/html-to-text";
import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";
import { Copy, Wand2 } from "lucide-react";

interface StudioDocumentPreviewProps {
  content: string;
  placeholder: string;
  isGenerating?: boolean;
  generatingLabel?: string;
  copyFeedback?: boolean;
  hasPendingUnsavedChanges?: boolean;
  isSaving?: boolean;
  savedConfirmationVisible?: boolean;
  saveStatusVariant?: DocumentSaveStatusBarVariant;
  onCopy: () => void;
  onSaveNow?: () => void;
  onContentChange?: (content: string) => void;
  onDownloadPdf?: () => Promise<void>;
  onDownloadDocx?: () => Promise<void>;
  showDocumentDownload?: boolean;
  generateCtaLabel?: string;
  onGenerateCta?: () => void;
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
  onImproveWithUnibot?: () => void;
  improveDisabled?: boolean;
}

/** Typography on the preview body — matches `utils/pdf-export.tsx` (A4 Helvetica). */
export const documentPreviewBodyTypography = "font-sans text-[11pt] leading-[1.6] text-[#333] dark:text-[#333]";

export const documentPreviewEditorClass =
  `${APPLICATION_DOCUMENT_BODY_CLASS} [&_.diff-region-block]:font-sans ` +
  "[&_ul]:list-disc [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:pl-0 [&_ol]:list-decimal [&_ol]:my-2 [&_ol]:ml-5 [&_ol]:pl-0 [&_li]:mb-1";

const StudioDocumentPreview = ({
  content,
  placeholder,
  isGenerating = false,
  generatingLabel = "Generating draft...",
  copyFeedback = false,
  hasPendingUnsavedChanges = false,
  isSaving = false,
  savedConfirmationVisible = false,
  saveStatusVariant = "studio",
  onCopy,
  onSaveNow,
  onContentChange,
  onDownloadPdf,
  onDownloadDocx,
  showDocumentDownload = false,
  generateCtaLabel,
  onGenerateCta,
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
  onImproveWithUnibot,
  improveDisabled = false,
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
  const showSaveStatus = showActions && !hasPendingRevision && (hasPendingUnsavedChanges || isSaving || savedConfirmationVisible);
  const showGenerateOverlay = Boolean(onGenerateCta && generateCtaLabel && !hasContent && !isGenerating && !hasPendingRevision);

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

  const handleDownload = async (action: () => Promise<void>) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await action();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChange = (val: string) => {
    setLocalContent(val);
    onContentChange?.(val);
  };

  const toolbarActionClass =
    "flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";

  const toolbar = (
    <div className="flex min-h-[52px] items-center justify-between gap-2 p-4">
      <div className="flex shrink-0 items-center gap-2">
        {showActions && onImproveWithUnibot && !hasPendingRevision ? (
          <button type="button" onClick={onImproveWithUnibot} disabled={improveDisabled} className={toolbarActionClass}>
            <Wand2 size={14} />
            Improve with Unibot
          </button>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <DocumentSaveStatusBar
          variant={saveStatusVariant}
          hasPendingUnsavedChanges={hasPendingUnsavedChanges}
          isSaving={isSaving}
          savedConfirmationVisible={savedConfirmationVisible}
          onSaveNow={onSaveNow}
          visible={showSaveStatus}
        />
        {showActions ? (
          <>
            <button type="button" onClick={handleCopy} aria-label="Copy to clipboard" className={toolbarActionClass}>
              <Copy size={14} />
              {copyFeedback ? "Copied!" : "Copy"}
            </button>
            {showDocumentDownload && onDownloadPdf && onDownloadDocx ? (
              <ApplicationAssetDownloadMenu
                disabled={isDownloading}
                isBusy={isDownloading}
                onDownloadPdf={() => handleDownload(onDownloadPdf)}
                onDownloadDocx={() => handleDownload(onDownloadDocx)}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <ApplicationDocumentPageFrame variant="studio" header={toolbar} className="min-h-[min(68vh,580px)]">
      {showDiffView ? (
        <div className="relative overflow-hidden">
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
        <div className={`relative ${documentPreviewBodyTypography} ${isGenerating || showGenerateOverlay ? "min-h-[320px]" : ""}`}>
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
                  documentBody={htmlToPlainText(displayContent)}
                  disabled={stripDisabled}
                  disabledReason={stripDisabledReason}
                  onActionFired={clearSelection}
                />
              ) : null}
            </>
          ) : (
            <p className="font-sans text-[11pt] text-slate-400">{placeholder}</p>
          )}
          {showGenerateOverlay ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-[1px] dark:bg-slate-900/85">
              <button
                type="button"
                onClick={onGenerateCta}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-700 active:scale-[0.99]"
              >
                <Wand2 size={16} />
                {generateCtaLabel}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </ApplicationDocumentPageFrame>
  );
};

export default StudioDocumentPreview;
