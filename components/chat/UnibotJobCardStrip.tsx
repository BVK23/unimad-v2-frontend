"use client";

import React, { useState } from "react";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import type { UnimadJobCardsPayload } from "@/src/features/adk-chat/parse-unimad-job-cards";
import type { Job } from "@/types/jobs";

type Props = {
  payload: UnimadJobCardsPayload;
  onSeeMore?: (path: string) => void;
};

export function UnibotJobCardStrip({ payload, onSeeMore }: Props) {
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <div className="mt-2 max-w-full space-y-2">
      <div className="flex flex-col gap-2">
        {payload.jobs.map(job => (
          <button
            key={job.id}
            type="button"
            onClick={() => setSelected(job)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900"
          >
            <CompanyLogo logoUrl={job.logo} company={job.company} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{job.role}</p>
              <p className="truncate text-[11px] text-slate-500">
                {job.company} · {job.location}
              </p>
            </div>
          </button>
        ))}
      </div>
      {payload.seeMorePath ? (
        <button
          type="button"
          onClick={() => onSeeMore?.(payload.seeMorePath!)}
          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
        >
          {payload.seeMoreLabel ?? "See more on Job Board"}
        </button>
      ) : null}
      {selected ? <JobDetailsModal job={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
