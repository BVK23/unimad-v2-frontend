"use client";

import type React from "react";
import { Pencil, Trash2 } from "lucide-react";

type UnibotUserMessageToolbarProps = {
  disabled?: boolean;
  /** Preset / quick-action cards are delete-only — editing resends the raw prompt. */
  showEdit?: boolean;
  onEdit?: () => void;
  onDelete: () => void;
};

/** Actions on a sent user message — edit re-sends after rewind; delete rewinds only. */
export function UnibotUserMessageToolbar({
  disabled,
  showEdit = true,
  onEdit,
  onDelete,
}: UnibotUserMessageToolbarProps): React.JSX.Element {
  const btnClass =
    "inline-flex items-center justify-center rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 disabled:opacity-30 dark:hover:bg-white/10";

  return (
    <div className="flex items-center justify-end gap-0.5">
      {showEdit && onEdit ? (
        <button type="button" onClick={onEdit} disabled={disabled} title="Edit message" aria-label="Edit message" className={btnClass}>
          <Pencil size={12} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        disabled={disabled}
        title="Delete message"
        aria-label="Delete message"
        className={`${btnClass} hover:text-red-600 dark:hover:text-red-400`}
      >
        <Trash2 size={12} aria-hidden />
      </button>
    </div>
  );
}

type UnibotEditableUserBubbleProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

/** Inline editor for a user message — Enter sends, Shift+Enter newline, Escape cancels. */
export function UnibotEditableUserBubble({
  value,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}: UnibotEditableUserBubbleProps): React.JSX.Element {
  return (
    <div className="flex w-full max-w-full flex-col items-end gap-1">
      <textarea
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
              onSubmit();
            }
          }
        }}
        rows={3}
        className="w-full min-w-[200px] max-w-full resize-y rounded-2xl rounded-tr-sm border border-brand-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-800 outline-none ring-brand-500/30 focus:ring-2 dark:border-brand-600 dark:bg-[#1a1a1a] dark:text-slate-100"
        aria-label="Edit message"
      />
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span>Enter to resend</span>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
