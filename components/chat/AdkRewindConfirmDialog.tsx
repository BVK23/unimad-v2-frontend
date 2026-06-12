"use client";

import { createPortal } from "react-dom";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { Loader2, Undo2, X } from "lucide-react";

export interface AdkRewindConfirmDialogProps {
  open: boolean;
  previewText: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (revertEditorState: boolean) => void;
}

export function AdkRewindConfirmDialog({
  open,
  previewText,
  isSubmitting,
  onClose,
  onConfirm,
}: AdkRewindConfirmDialogProps): React.JSX.Element | null {
  if (!open || typeof document === "undefined") return null;

  const trimmedPreview = previewText.trim();
  const preview = trimmedPreview.length > 160 ? `${trimmedPreview.slice(0, 160).trimEnd()}…` : trimmedPreview;

  return createPortal(
    <div
      className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200`}
      role="presentation"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adk-rewind-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#141414]"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Undo2 size={18} className="shrink-0 text-brand-600" aria-hidden />
            <h2 id="adk-rewind-title" className="text-sm font-semibold">
              Rewind conversation?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          This undoes this message and everything after it. Unibot will forget those turns on the next reply.
        </p>

        {preview ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] italic text-slate-500 dark:bg-white/5 dark:text-slate-400">
            &ldquo;{preview}&rdquo;
          </p>
        ) : null}

        <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
          If Unibot changed your resume or portfolio drafts in this thread, choose whether to mirror those reversions in the editor too.
          Changes you already accepted and saved to Unimad are not undone.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Rewind and revert editor
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(false)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Rewind only
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
