"use client";

type ContentGenDraftReviewChipsProps = {
  disabled?: boolean;
  actionsOutOfContext?: boolean;
  onAccept: () => void;
  onImprove: () => void;
  onBlockedAction?: () => void;
};

export const ContentGenDraftReviewChips = ({
  disabled = false,
  actionsOutOfContext = false,
  onAccept,
  onImprove,
  onBlockedAction,
}: ContentGenDraftReviewChipsProps) => {
  const runAction = (action: () => void) => {
    if (actionsOutOfContext) {
      onBlockedAction?.();
      return;
    }
    if (disabled) return;
    action();
  };

  return (
    <div className="mt-2 flex max-w-full flex-wrap gap-2">
      <button
        type="button"
        onClick={() => runAction(onAccept)}
        disabled={disabled}
        className="rounded-full bg-emerald-700 px-3 py-1.5 text-left text-[11px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={() => runAction(onImprove)}
        disabled={disabled}
        className="rounded-full bg-slate-900 px-3 py-1.5 text-left text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        Improve
      </button>
    </div>
  );
};
