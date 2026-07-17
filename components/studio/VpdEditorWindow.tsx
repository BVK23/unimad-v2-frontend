"use client";

import React from "react";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import { PrepareApplicationReturnBar } from "@/components/jobs/PrepareApplicationReturnBar";
import ResumePublishedBeacon from "@/components/resume/ResumePublishedBeacon";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { isPersistedVpdId } from "@/features/vpd/utils/isPersistedVpdId";
import { isVpdTemplateId } from "@/features/vpd/utils/isVpdTemplateId";
import type { PrepareApplicationReturnSession } from "@/lib/jobs/prepare-application-return";
import { htmlToPlainText } from "@/utils/html-to-text";
import { Eye, Loader2, X } from "lucide-react";
import { PortfolioItem } from "../../types";
import ProjectDetailView from "../ProjectDetailView";
import PortfolioImage from "../portfolio/PortfolioImage";
import VpdExportActions from "./VpdExportActions";

interface VpdEditorWindowProps {
  project: PortfolioItem;
  onClose: () => void;
  onUpdateProject: (updated: PortfolioItem) => void;
  /** Render inside the Studio workspace instead of a full-viewport portal. */
  embedded?: boolean;
  hasPendingUnsavedChanges?: boolean;
  isSaving?: boolean;
  savedConfirmationVisible?: boolean;
  onSaveNow?: () => void;
  showSaveStatus?: boolean;
  saveErrorMessage?: string | null;
  slug?: string | null;
  onSlugChange?: (slug: string) => void;
  publishedAt?: string | null;
  onBeforePublish?: () => Promise<void>;
  /** Soft CTA after dismissing the once-per-session claim modal. */
  claimBannerVisible?: boolean;
  onClaimAsMyVpd?: () => void;
  isClaimingTemplate?: boolean;
  savingLabel?: string;
  /** Full-canvas preview (published-like). */
  isPreviewMode?: boolean;
  onEnterPreview?: () => void;
  onExitPreview?: () => void;
  /** When set (Improve from Prepare), replaces the white toolbar until dismissed. */
  prepareReturnSession?: PrepareApplicationReturnSession | null;
  prepareReturnShowSaveAndReturn?: boolean;
  onPrepareReturnSaveAndReturn?: () => void;
  onPrepareReturnDismiss?: () => void;
}

const VpdEditorWindow: React.FC<VpdEditorWindowProps> = ({
  project,
  onClose,
  onUpdateProject,
  embedded = false,
  hasPendingUnsavedChanges = false,
  isSaving = false,
  savedConfirmationVisible = false,
  onSaveNow,
  showSaveStatus = false,
  saveErrorMessage = null,
  slug = null,
  onSlugChange,
  publishedAt = null,
  onBeforePublish,
  claimBannerVisible = false,
  onClaimAsMyVpd,
  isClaimingTemplate = false,
  savingLabel,
  isPreviewMode = false,
  onEnterPreview,
  onExitPreview,
  prepareReturnSession = null,
  prepareReturnShowSaveAndReturn = true,
  onPrepareReturnSaveAndReturn,
  onPrepareReturnDismiss,
}) => {
  const showPrepareReturnBar = Boolean(prepareReturnSession && onPrepareReturnDismiss);
  const showExportActions =
    !showPrepareReturnBar && !isPreviewMode && Boolean(onSlugChange) && isPersistedVpdId(project.id) && !isVpdTemplateId(project.id);
  const toolbarTitle = htmlToPlainText(project.title || "").trim() || "Untitled VPD";
  const iconUrl = typeof project.iconUrl === "string" ? project.iconUrl.trim() : "";
  const isPublished = Boolean(slug?.trim());

  const editorContent = (
    <>
      {showPrepareReturnBar && prepareReturnSession ? (
        <PrepareApplicationReturnBar
          session={prepareReturnSession}
          showSaveAndReturn={prepareReturnShowSaveAndReturn}
          onSaveAndReturn={() => onPrepareReturnSaveAndReturn?.()}
          onDismiss={onPrepareReturnDismiss!}
        />
      ) : (
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {iconUrl ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                <PortfolioImage src={iconUrl} alt="" fill sizes="36px" className="object-cover" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Value Prop Doc</p>
              <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{toolbarTitle}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {showSaveStatus && !isPreviewMode ? (
              <DocumentSaveStatusBar
                hasPendingUnsavedChanges={hasPendingUnsavedChanges}
                isSaving={isSaving}
                savedConfirmationVisible={savedConfirmationVisible}
                onSaveNow={onSaveNow}
                saveNowLabel="Save Now"
                savingLabel={savingLabel ?? (isSaving ? "Saving..." : "Autosaving...")}
                visible={hasPendingUnsavedChanges || isSaving || savedConfirmationVisible}
                variant="studio"
              />
            ) : null}
            {isPreviewMode && isPublished ? <ResumePublishedBeacon label="VPD published" publishedAt={publishedAt} /> : null}
            {showExportActions ? (
              <VpdExportActions
                project={project}
                slug={slug}
                onSlugChange={onSlugChange}
                onBeforePublish={onBeforePublish}
                publishedAt={publishedAt}
                className="hidden shrink-0 sm:flex"
              />
            ) : null}
            {isPreviewMode ? (
              <button
                type="button"
                onClick={onExitPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Edit
              </button>
            ) : onEnterPreview ? (
              <button
                type="button"
                onClick={onEnterPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                <Eye size={14} />
                Preview
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      {claimBannerVisible && onClaimAsMyVpd && !isPreviewMode ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200/80 bg-amber-50 px-5 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="min-w-0 text-xs font-medium text-amber-900 dark:text-amber-200">
            Edits aren’t saved yet — this is still a template. Save it as your own VPD to keep them.
          </p>
          <button
            type="button"
            onClick={onClaimAsMyVpd}
            disabled={isClaimingTemplate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {isClaimingTemplate ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
            Save as my VPD
          </button>
        </div>
      ) : null}
      {saveErrorMessage ? (
        <div
          className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          role="alert"
        >
          Could not save VPD: {saveErrorMessage}
        </div>
      ) : null}
      {showExportActions ? (
        <div className="flex shrink-0 border-b border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-950 sm:hidden">
          <VpdExportActions
            project={project}
            slug={slug}
            onSlugChange={onSlugChange}
            onBeforePublish={onBeforePublish}
            publishedAt={publishedAt}
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <ProjectDetailView
          project={project}
          onBack={onClose}
          onUpdateProject={onUpdateProject}
          allowedBlockTypes={["text", "media", "link-box", "page-card", "table"]}
          gridColumns={12}
          maxWidthClassName="max-w-5xl"
          coverLayout="banner"
          hideToolbar
          hideEditModeToggle
          isEditMode={!isPreviewMode}
          onToggleEditMode={isPreviewMode ? onExitPreview : onEnterPreview ? () => onEnterPreview() : undefined}
          isNestedDetailView={false}
        />
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 animate-in fade-in duration-200 dark:bg-slate-950">
        {editorContent}
      </div>
    );
  }

  return (
    <ModalPortalOverlay className="flex flex-col bg-slate-100 dark:bg-slate-950 animate-in fade-in duration-200">
      {editorContent}
    </ModalPortalOverlay>
  );
};

export default VpdEditorWindow;
