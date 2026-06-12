import React from "react";

const pulseClass = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

interface JobCardSkeletonProps {
  /** Match JobCard layout when action buttons are hidden (search/browse grids). */
  hideButtons?: boolean;
}

const JobCardSkeleton: React.FC<JobCardSkeletonProps> = ({ hideButtons = false }) => {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111]" aria-hidden>
      <div className={`flex gap-4 ${hideButtons ? "mb-0" : "mb-4"} relative`}>
        <div className={`h-12 w-12 shrink-0 rounded-xl ${pulseClass}`} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-4 w-3/4 ${pulseClass}`} />
          <div className={`h-3 w-full ${pulseClass}`} />
          <div className="flex gap-1.5">
            <div className={`h-5 w-12 ${pulseClass}`} />
            <div className={`h-5 w-14 ${pulseClass}`} />
          </div>
        </div>
      </div>
      {!hideButtons && (
        <div className="mt-auto flex items-center gap-2">
          <div className={`h-9 flex-1 rounded-lg ${pulseClass}`} />
          <div className={`h-9 flex-1 rounded-lg ${pulseClass}`} />
        </div>
      )}
    </div>
  );
};

export default JobCardSkeleton;
