"use client";

import { createPortal } from "react-dom";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { type ScopeMatch } from "@/src/features/adk-chat/content-scope";
import { Loader2, Undo2, X } from "lucide-react";

export type RewindConfirmMode = "edit" | "delete";

export interface AdkRewindConfirmDialogProps {
  open: boolean;
  mode: RewindConfirmMode;
  previewText: string;
  isSubmitting: boolean;
  scopeMatch?: ScopeMatch;
  featureLabel?: string;
  canOfferStateRevert?: boolean;
  showHeavyWorkWarning?: boolean;
  redirectTargetLabel?: string;
  onClose: () => void;
  onConfirm: (options: { revertEditorState: boolean; redirectAfterRewind?: boolean }) => void;
}

export function AdkRewindConfirmDialog({
  open,
  mode,
  previewText,
  isSubmitting,
  scopeMatch = "full",
  featureLabel = "this page",
  canOfferStateRevert = false,
  showHeavyWorkWarning = false,
  redirectTargetLabel,
  onClose,
  onConfirm,
}: AdkRewindConfirmDialogProps): React.JSX.Element | null {
  if (!open || typeof document === "undefined") return null;

  const trimmedPreview = previewText.trim();
  const preview = trimmedPreview.length > 160 ? `${trimmedPreview.slice(0, 160).trimEnd()}…` : trimmedPreview;
  const onSameFeature = scopeMatch === "full";
  const showRedirectOption = scopeMatch === "cross_domain";

  const bodyText =
    mode === "edit"
      ? onSameFeature
        ? `Editing and sending will rewind your chat to this point and send a new message.`
        : `This message belongs to your ${redirectTargetLabel ?? "other"} flow. Rewind updates that conversation thread.`
      : onSameFeature
        ? `This removes this message and everything after it from the chat.`
        : `This message belongs to your ${redirectTargetLabel ?? "other"} flow. Rewind removes it and later turns from that thread.`;

  const stateRevertHint =
    mode === "edit"
      ? `You can also revert your ${featureLabel} work to match the conversation at this point.`
      : `You can also revert your ${featureLabel} work to match the conversation at this point.`;

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
              {mode === "edit" ? "Edit and rewind chat?" : "Delete and rewind chat?"}
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

        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{bodyText}</p>

        {preview ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] italic text-slate-500 dark:bg-white/5 dark:text-slate-400">
            &ldquo;{preview}&rdquo;
          </p>
        ) : null}

        {onSameFeature && canOfferStateRevert ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">{stateRevertHint}</p>
        ) : null}

        {showHeavyWorkWarning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            You have edited {featureLabel} since Unibot last synced with this chat. Reverting your work may undo changes that are not
            reflected in the conversation. We recommend rewinding the chat only.
          </p>
        ) : null}

        {scopeMatch === "partial" ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
            This message is from a specific section of {featureLabel} (e.g. headline), not the whole page. Only the chat will be rewound —
            your profile on screen stays as-is unless you accepted a change there.
          </p>
        ) : null}

        {showRedirectOption ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
            Rewind here only updates the conversation. Open {redirectTargetLabel ?? "that flow"} to verify editor changes there.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm({ revertEditorState: false })}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {mode === "edit" ? "Rewind & send" : "Rewind & delete"}
          </button>

          {canOfferStateRevert ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirm({ revertEditorState: true })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === "edit" ? "Revert work & send" : "Revert work too"}
            </button>
          ) : null}

          {showRedirectOption ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirm({ revertEditorState: false, redirectAfterRewind: true })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-950/30"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Open {redirectTargetLabel ?? "that flow"}
            </button>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
