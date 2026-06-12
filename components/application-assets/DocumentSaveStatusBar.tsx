"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";

export type DocumentSaveStatusBarVariant = "studio" | "modal";

type DocumentSaveStatusBarProps = {
  hasPendingUnsavedChanges: boolean;
  isSaving: boolean;
  savedConfirmationVisible: boolean;
  onSaveNow?: () => void;
  visible?: boolean;
  variant?: DocumentSaveStatusBarVariant;
};

export function DocumentSaveStatusBar({
  hasPendingUnsavedChanges,
  isSaving,
  savedConfirmationVisible,
  onSaveNow,
  visible = true,
  variant = "studio",
}: DocumentSaveStatusBarProps) {
  if (!visible) return null;

  const showSaved = savedConfirmationVisible && !hasPendingUnsavedChanges && !isSaving;
  const unsavedClass = variant === "modal" ? "text-slate-600 dark:text-slate-400" : "text-amber-600 dark:text-amber-400";
  const saveNowClass =
    variant === "modal"
      ? "text-brand-600 hover:text-brand-700 dark:text-brand-400"
      : "text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400";
  const savedIconClass = variant === "modal" ? "text-slate-400" : "text-emerald-500";
  const labelClass = "whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400";

  return (
    <div className="relative mx-1 flex h-8 w-56 items-center justify-end overflow-hidden text-sm transition-all duration-300">
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${showSaved ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <CheckCircle2 size={14} className={`mr-1.5 ${savedIconClass}`} />
        <span className={labelClass}>All changes saved</span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${isSaving ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <RefreshCw size={14} className="mr-1.5 animate-spin text-slate-400" />
        <span className={labelClass}>Autosaving...</span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${hasPendingUnsavedChanges && !isSaving ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <span className={`mr-2 whitespace-nowrap text-xs font-medium ${unsavedClass}`}>Unsaved changes</span>
        {onSaveNow ? (
          <button type="button" onClick={onSaveNow} className={`cursor-pointer whitespace-nowrap text-xs font-semibold ${saveNowClass}`}>
            Save now
          </button>
        ) : null}
      </div>
    </div>
  );
}
