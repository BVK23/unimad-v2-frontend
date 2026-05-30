"use client";

import { UNICOACH_PORTFOLIO_VIDEO_URL } from "@/constants/unicoach-niche-content";

export const UnicoachStage2PostCall1Panel: React.FC = () => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Complete your post–Call 1 tasks in the checklist, then watch this walkthrough while your coach prepares the next milestone.
    </p>
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
      <video src={UNICOACH_PORTFOLIO_VIDEO_URL} controls className="h-full w-full object-cover" preload="metadata" />
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">Use the Resources tab for resume, portfolio, and LinkedIn guidelines.</p>
  </div>
);
