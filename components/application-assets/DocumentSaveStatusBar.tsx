"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";

export type DocumentSaveStatusBarVariant = "studio" | "modal";

type DocumentSaveStatusBarProps = {
  hasPendingUnsavedChanges: boolean;
  isSaving: boolean;
  savedConfirmationVisible: boolean;
  onSaveNow?: () => void;
  onCancel?: () => void;
  visible?: boolean;
  variant?: DocumentSaveStatusBarVariant;
};

const statusTextClass = "whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400";
const saveActionClass =
  "cursor-pointer whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400";
const cancelActionClass =
  "cursor-pointer whitespace-nowrap text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200";

function UnsavedChangesRow({ saveLabel, onSaveNow, onCancel }: { saveLabel: string; onSaveNow?: () => void; onCancel?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={statusTextClass}>Unsaved changes</span>
      {onSaveNow ? (
        <button type="button" onClick={onSaveNow} className={saveActionClass}>
          {saveLabel}
        </button>
      ) : null}
      {onCancel ? (
        <button type="button" onClick={onCancel} className={cancelActionClass}>
          Cancel
        </button>
      ) : null}
    </div>
  );
}

export function DocumentSaveStatusBar({
  hasPendingUnsavedChanges,
  isSaving,
  savedConfirmationVisible,
  onSaveNow,
  onCancel,
  visible = true,
  variant = "studio",
}: DocumentSaveStatusBarProps) {
  if (!visible) return null;

  const isModal = variant === "modal";
  const showSaved = savedConfirmationVisible && !hasPendingUnsavedChanges && !isSaving;
  const savedIconClass = isModal ? "text-slate-400" : "text-emerald-500";
  const saveLabel = isModal ? "Save" : "save";

  if (isModal) {
    if (isSaving) {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className="animate-spin text-slate-400" />
          <span className={statusTextClass}>Autosaving...</span>
        </div>
      );
    }
    if (hasPendingUnsavedChanges) {
      return <UnsavedChangesRow saveLabel={saveLabel} onSaveNow={onSaveNow} onCancel={onCancel} />;
    }
    if (showSaved) {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 size={14} className={savedIconClass} />
          <span className={statusTextClass}>All changes saved</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative mx-1 flex h-8 w-48 items-center justify-end overflow-hidden text-sm transition-all duration-300">
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${showSaved ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <CheckCircle2 size={14} className={`mr-1.5 ${savedIconClass}`} />
        <span className={statusTextClass}>All changes saved</span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${isSaving ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <RefreshCw size={14} className="mr-1.5 animate-spin text-slate-400" />
        <span className={statusTextClass}>Autosaving...</span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${hasPendingUnsavedChanges && !isSaving ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <UnsavedChangesRow saveLabel={saveLabel} onSaveNow={onSaveNow} />
      </div>
    </div>
  );
}
