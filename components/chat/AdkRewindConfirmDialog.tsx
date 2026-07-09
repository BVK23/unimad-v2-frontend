"use client";

import { createPortal } from "react-dom";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { type ScopeMatch } from "@/src/features/adk-chat/content-scope";
import type { ThreadDeleteKind } from "@/src/features/adk-chat/is-first-thread-user-message";
import { Loader2, Trash2, Undo2, X } from "lucide-react";

export type RewindConfirmMode = "edit" | "delete";

export type FeatureGateKind = "none" | "navigate_required" | "feature_missing";

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
  isFirstMessage?: boolean;
  isLastMessage?: boolean;
  threadDeleteKind?: ThreadDeleteKind;
  /** Off-feature edit: must navigate first. Missing feature: cannot edit. */
  featureGate?: FeatureGateKind;
  onClose: () => void;
  onConfirm: (options: { revertEditorState: boolean; redirectAfterRewind?: boolean; navigateOnly?: boolean }) => void;
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
  isFirstMessage = false,
  isLastMessage = false,
  threadDeleteKind = "main",
  featureGate = "none",
  onClose,
  onConfirm,
}: AdkRewindConfirmDialogProps): React.JSX.Element | null {
  if (!open || typeof document === "undefined") return null;

  const trimmedPreview = previewText.trim();
  const preview = trimmedPreview.length > 160 ? `${trimmedPreview.slice(0, 160).trimEnd()}…` : trimmedPreview;
  const onSameFeature = scopeMatch === "full";
  const threadLabel = threadDeleteKind === "sub" ? "sub-thread" : "chat thread";
  const isDelete = mode === "delete";
  const featureName = redirectTargetLabel ?? "that page";
  const isNavigateGate = mode === "edit" && featureGate === "navigate_required";
  const isMissingGate = mode === "edit" && featureGate === "feature_missing";
  const useTwoActionLayout = isDelete && canOfferStateRevert && !isNavigateGate && !isMissingGate;
  const showOffFeatureDeleteHint = isDelete && scopeMatch === "cross_domain";

  const title = isMissingGate
    ? "Can't edit this message"
    : isNavigateGate
      ? `Open ${featureName} to edit?`
      : mode === "edit"
        ? "Edit and rewind chat?"
        : isFirstMessage
          ? `Delete entire ${threadLabel}?`
          : "Delete and rewind chat?";

  const bodyText = isMissingGate
    ? `This message belongs to ${featureLabel}, but that content is no longer available. You can still delete the chat message — editing and sending is not available.`
    : isNavigateGate
      ? `Editing and sending needs you on the ${featureName} page first so Unibot can sync the latest content. Open it, then edit this message again.`
      : mode === "edit"
        ? onSameFeature
          ? `Editing and sending will rewind your chat to this point and send a new message.`
          : `This message belongs to your ${featureName} flow.`
        : isFirstMessage
          ? `This is the first message in this ${threadLabel}. Deleting it removes the entire ${threadLabel} permanently.`
          : isLastMessage
            ? onSameFeature
              ? `This removes this message from the chat.`
              : `This removes this message from the chat. Editor changes on ${featureName} are left as-is.`
            : onSameFeature
              ? `This removes this message and everything after it from the chat.`
              : `This removes this message and later turns from the chat. Editor changes on ${featureName} are left as-is.`;

  const stateRevertHint =
    mode === "edit"
      ? `You can also revert ${featureLabel} to match the conversation at this point.`
      : isFirstMessage
        ? `Unibot made changes to ${featureLabel} during this ${threadLabel}. You can revert those changes before deleting.`
        : `Unibot made changes to ${featureLabel} after this message. You can revert those changes when deleting.`;

  const primaryDeleteLabel = useTwoActionLayout
    ? "Just Delete"
    : isFirstMessage
      ? "Delete"
      : mode === "edit"
        ? "Rewind & send"
        : "Rewind & delete";
  const revertWorkLabel = isFirstMessage || isDelete ? "Revert changes" : mode === "edit" ? "Revert work & send" : "Revert work too";

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
            {isFirstMessage && isDelete ? (
              <Trash2 size={18} className="shrink-0 text-red-600" aria-hidden />
            ) : (
              <Undo2 size={18} className="shrink-0 text-brand-600" aria-hidden />
            )}
            <h2 id="adk-rewind-title" className="text-sm font-semibold">
              {title}
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

        {onSameFeature && canOfferStateRevert && !showHeavyWorkWarning && featureGate === "none" ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">{stateRevertHint}</p>
        ) : null}

        {showHeavyWorkWarning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            You have edited {featureLabel} since Unibot last synced with this chat. Reverting may undo edits that are not reflected in the
            conversation. We recommend deleting the chat only.
          </p>
        ) : null}

        {scopeMatch === "partial" && !(isFirstMessage && isDelete) && featureGate === "none" ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
            This message is from a specific section of {featureLabel}. Only the chat will be rewound here.
          </p>
        ) : null}

        {showOffFeatureDeleteHint ? (
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
            You are not on the {featureName} page, so only the chat is updated. Open {featureName} if you also want to revert editor changes
            there.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          {isMissingGate ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              Got it
            </button>
          ) : isNavigateGate ? (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirm({ revertEditorState: false, navigateOnly: true })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                Open {featureName}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </>
          ) : useTwoActionLayout ? (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirm({ revertEditorState: true })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {revertWorkLabel}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirm({ revertEditorState: false })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/30"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {primaryDeleteLabel}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirm({ revertEditorState: false })}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-colors disabled:opacity-60 ${
                  isFirstMessage && isDelete ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {primaryDeleteLabel}
              </button>

              {canOfferStateRevert ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onConfirm({ revertEditorState: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {revertWorkLabel}
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
