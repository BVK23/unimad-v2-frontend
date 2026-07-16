"use client";

import React from "react";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { isPersistedVpdId } from "@/features/vpd/utils/isPersistedVpdId";
import { isVpdTemplateId } from "@/features/vpd/utils/isVpdTemplateId";
import { htmlToPlainText } from "@/utils/html-to-text";
import { Loader2, X } from "lucide-react";
import { PortfolioItem } from "../../types";
import ProjectDetailView from "../ProjectDetailView";
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
  onBeforePublish?: () => Promise<void>;
  /** Soft CTA after dismissing the once-per-session claim modal. */
  claimBannerVisible?: boolean;
  onClaimAsMyVpd?: () => void;
  isClaimingTemplate?: boolean;
  savingLabel?: string;
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
  onBeforePublish,
  claimBannerVisible = false,
  onClaimAsMyVpd,
  isClaimingTemplate = false,
  savingLabel,
}) => {
  const showExportActions = Boolean(onSlugChange) && isPersistedVpdId(project.id) && !isVpdTemplateId(project.id);
  const toolbarTitle = htmlToPlainText(project.title || "").trim() || "Untitled VPD";

  const editorContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Value Prop Doc</p>
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{toolbarTitle}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {showSaveStatus ? (
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
          {showExportActions ? (
            <VpdExportActions
              project={project}
              slug={slug}
              onSlugChange={onSlugChange}
              onBeforePublish={onBeforePublish}
              className="hidden shrink-0 sm:flex"
            />
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
      {claimBannerVisible && onClaimAsMyVpd ? (
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
          <VpdExportActions project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4 py-6 md:px-8">
        <div className="h-full w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <ProjectDetailView
            project={project}
            onBack={onClose}
            onUpdateProject={onUpdateProject}
            allowedBlockTypes={["text", "media", "link-box", "page-card", "table"]}
            gridColumns={12}
            maxWidthClassName="max-w-5xl"
            hideToolbar
            hideEditModeToggle
            isNestedDetailView={false}
          />
        </div>
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
