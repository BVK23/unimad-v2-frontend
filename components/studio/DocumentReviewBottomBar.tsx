"use client";

import { Check, RotateCcw, Save } from "lucide-react";

type DocumentReviewBottomBarProps = {
  reviewedCount: number;
  totalCount: number;
  onKeepAll: () => void;
  onUndoAll: () => void;
  onRevertAll: () => void;
  onApply: () => void;
  busy?: boolean;
  applyDisabled?: boolean;
  applyDisabledReason?: string;
};

const DocumentReviewBottomBar = ({
  reviewedCount,
  totalCount,
  onKeepAll,
  onUndoAll,
  onRevertAll,
  onApply,
  busy = false,
  applyDisabled = false,
  applyDisabledReason,
}: DocumentReviewBottomBarProps) => {
  if (totalCount === 0) {
    return null;
  }

  const allReviewed = reviewedCount === totalCount;

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 animate-in slide-in-from-bottom-5">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-4 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mr-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="flex h-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            {reviewedCount}/{totalCount}
          </span>
          <span>reviewed</span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndoAll}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-orange-900/30"
          >
            <RotateCcw size={14} />
            Undo all
          </button>
          <button
            type="button"
            onClick={onKeepAll}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-green-900/30"
          >
            <Check size={14} />
            Keep all
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2 pl-2">
          <button
            type="button"
            onClick={onRevertAll}
            disabled={busy}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50 dark:hover:text-slate-200"
          >
            Revert all
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={busy || applyDisabled}
            title={applyDisabled ? applyDisabledReason : undefined}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${
              allReviewed ? "bg-brand-600 hover:bg-brand-700" : "bg-slate-800 hover:bg-slate-900 dark:bg-brand-600 dark:hover:bg-brand-700"
            }`}
          >
            <Save size={14} />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewBottomBar;
