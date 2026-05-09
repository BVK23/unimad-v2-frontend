import React from "react";

const pulseClass = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-full" aria-hidden>
      <div className="flex gap-4 mb-4 relative">
        <div className={`w-12 h-12 rounded-xl shrink-0 ${pulseClass}`} />
        <div className="flex-1 min-w-0 pr-10 space-y-2">
          <div className={`h-4 w-3/4 ${pulseClass}`} />
          <div className={`h-3 w-full ${pulseClass}`} />
          <div className="flex gap-1.5">
            <div className={`h-5 w-12 ${pulseClass}`} />
            <div className={`h-5 w-14 ${pulseClass}`} />
          </div>
        </div>
        <div className={`absolute top-4 right-4 w-10 h-10 rounded-full ${pulseClass}`} />
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <div className={`flex-1 h-9 rounded-lg ${pulseClass}`} />
        <div className={`flex-1 h-9 rounded-lg ${pulseClass}`} />
      </div>
    </div>
  );
};

export default JobCardSkeleton;
