"use client";

import type { ContentGenPlannerAction } from "@/features/content-lab/api/content-gen-events";

type ContentGenPublishChipsProps = {
  onPostNow: () => void;
  onSchedule: () => void;
};

export const ContentGenPublishChips = ({ onPostNow, onSchedule }: ContentGenPublishChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2 max-w-full">
      <button
        type="button"
        onClick={onPostNow}
        className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
      >
        Post to LinkedIn
      </button>
      <button
        type="button"
        onClick={onSchedule}
        className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
      >
        Schedule post
      </button>
    </div>
  );
};

export const contentGenScheduleAction = (): ContentGenPlannerAction => ({
  id: "schedule",
  label: "Schedule post",
});
