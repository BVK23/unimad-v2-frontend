"use client";

type ContentGenDraftReviewChipsProps = {
  disabled?: boolean;
  onAccept: () => void;
  onImprove: () => void;
};

export const ContentGenDraftReviewChips = ({ disabled = false, onAccept, onImprove }: ContentGenDraftReviewChipsProps) => {
  return (
    <div className="mt-2 flex max-w-full flex-wrap gap-2">
      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="rounded-full bg-emerald-700 px-3 py-1.5 text-left text-[11px] font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
      >
        Accept
      </button>
      <button
        type="button"
        onClick={onImprove}
        disabled={disabled}
        className="rounded-full bg-slate-900 px-3 py-1.5 text-left text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        Improve
      </button>
    </div>
  );
};
