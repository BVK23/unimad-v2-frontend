"use client";

import React, { useCallback, useState, useTransition } from "react";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import { buildStudioHref } from "@/lib/jobs/prepare-application-url";
import type { UnimadJobCardsPayload } from "@/src/features/adk-chat/parse-unimad-job-cards";
import type { GeneratorContext, Job } from "@/types/jobs";
import { useRouter } from "next/navigation";

type Props = {
  payload: UnimadJobCardsPayload;
  onSeeMore?: (path: string) => void;
  /** Legacy shell (e.g. App.tsx); Next.js uniboard uses router fallback when omitted. */
  onNavigateToStudio?: (context: GeneratorContext) => void;
};

export function UnibotJobCardStrip({ payload, onSeeMore, onNavigateToStudio }: Props) {
  const [selected, setSelected] = useState<Job | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const navigateToStudio = useCallback(
    (context: GeneratorContext) => {
      if (onNavigateToStudio) {
        onNavigateToStudio(context);
        return;
      }
      startTransition(() => {
        router.push(
          buildStudioHref({
            id: context.assetId,
            type: context.type,
            jobId: context.fromInterviewVpd ? undefined : context.jobId,
            navigate: context.fromInterviewVpd ? undefined : context.navigate,
            improve: context.fromInterviewVpd ? undefined : context.openImproveMode,
            interviewVpd: context.fromInterviewVpd,
            view: context.fromInterviewVpd
              ? undefined
              : (context.view ?? (context.type === "vpd" && context.openImproveMode ? "edit" : undefined)),
          })
        );
      });
    },
    [onNavigateToStudio, router]
  );

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
      {selected ? <JobDetailsModal job={selected} onClose={() => setSelected(null)} onNavigateToStudio={navigateToStudio} /> : null}
    </div>
  );
}
