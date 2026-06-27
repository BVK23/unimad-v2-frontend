"use client";

import { useApplicationAssetDiffReviewUiStore } from "@/features/application-assets/store/useApplicationAssetDiffReviewUiStore";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const ApplicationAssetReviewStepperCard = () => {
  const sessionId = useApplicationAssetDiffReviewUiStore(s => s.sessionId);
  const regionIds = useApplicationAssetDiffReviewUiStore(s => s.regionIds);
  const decisions = useApplicationAssetDiffReviewUiStore(s => s.decisions);
  const activeRegionId = useApplicationAssetDiffReviewUiStore(s => s.activeRegionId);
  const setActiveRegionId = useApplicationAssetDiffReviewUiStore(s => s.setActiveRegionId);
  const keepRegion = useApplicationAssetDiffReviewUiStore(s => s.keepRegion);
  const undoRegion = useApplicationAssetDiffReviewUiStore(s => s.undoRegion);

  if (!sessionId || regionIds.length === 0) {
    return null;
  }

  const activeIndex = activeRegionId ? regionIds.indexOf(activeRegionId) : 0;
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const currentRegionId = regionIds[safeIndex];
  const currentDecision = currentRegionId ? decisions[currentRegionId] : undefined;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === regionIds.length - 1;

  const handlePrev = () => {
    if (!isFirst) {
      setActiveRegionId(regionIds[safeIndex - 1]!);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setActiveRegionId(regionIds[safeIndex + 1]!);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-brand-200 bg-white p-4 shadow-sm dark:border-brand-900/50 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Reviewing Edits</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Accept or Discard AI suggestions</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="rounded-md p-1 text-slate-600 transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Previous edit"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[2.5rem] px-1 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
            {safeIndex + 1} / {regionIds.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={isLast}
            className="rounded-md p-1 text-slate-600 transition-colors hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Next edit"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {currentRegionId && !currentDecision ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => undoRegion(currentRegionId)}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-800/50 dark:hover:bg-orange-900/20"
          >
            <RotateCcw size={14} />
            Undo
          </button>
          <button
            type="button"
            onClick={() => keepRegion(currentRegionId)}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-green-800/50 dark:hover:bg-green-900/20"
          >
            <Check size={14} />
            Keep
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-slate-50 py-2 text-center text-xs font-medium text-slate-400 dark:bg-slate-800">
          {currentDecision === "keep" ? "Suggestion Kept" : "Suggestion Undone"}
        </div>
      )}
    </div>
  );
};

export default ApplicationAssetReviewStepperCard;
