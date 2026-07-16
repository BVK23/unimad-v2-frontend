"use client";

import React from "react";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { X } from "lucide-react";
import { PortfolioItem } from "../../types";
import ProjectDetailView from "../ProjectDetailView";
import VpdExportActions from "./VpdExportActions";

interface VpdEditorWindowProps {
  project: PortfolioItem;
  onClose: () => void;
  onUpdateProject: (updated: PortfolioItem) => void;
  hasPendingUnsavedChanges?: boolean;
  isSaving?: boolean;
  savedConfirmationVisible?: boolean;
  onSaveNow?: () => void;
  showSaveStatus?: boolean;
  saveErrorMessage?: string | null;
  slug?: string | null;
  onSlugChange?: (slug: string) => void;
  onBeforePublish?: () => Promise<void>;
}

const VpdEditorWindow: React.FC<VpdEditorWindowProps> = ({
  project,
  onClose,
  onUpdateProject,
  hasPendingUnsavedChanges = false,
  isSaving = false,
  savedConfirmationVisible = false,
  onSaveNow,
  showSaveStatus = false,
  saveErrorMessage = null,
  slug = null,
  onSlugChange,
  onBeforePublish,
}) => {
  return (
    <ModalPortalOverlay className="flex flex-col bg-slate-100 dark:bg-slate-950 animate-in fade-in duration-200">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Value Prop Doc</p>
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{project.title || "Untitled VPD"}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {showSaveStatus ? (
            <DocumentSaveStatusBar
              hasPendingUnsavedChanges={hasPendingUnsavedChanges}
              isSaving={isSaving}
              savedConfirmationVisible={savedConfirmationVisible}
              onSaveNow={onSaveNow}
              saveNowLabel="Save Now"
              savingLabel={isSaving ? "Saving..." : "Autosaving..."}
              visible={hasPendingUnsavedChanges || isSaving || savedConfirmationVisible}
              variant="studio"
            />
          ) : null}
          <VpdExportActions
            project={project}
            slug={slug}
            onSlugChange={onSlugChange}
            onBeforePublish={onBeforePublish}
            className="hidden shrink-0 sm:flex"
          />
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
      {saveErrorMessage ? (
        <div
          className="shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          role="alert"
        >
          Could not save VPD: {saveErrorMessage}
        </div>
      ) : null}
      <div className="flex shrink-0 border-b border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-950 sm:hidden">
        <VpdExportActions project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} />
      </div>

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
            isNestedDetailView={false}
          />
        </div>
      </div>
    </ModalPortalOverlay>
  );
};

export default VpdEditorWindow;
