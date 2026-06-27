"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { Clock } from "lucide-react";
import { Job } from "../../types/jobs";
import { CompanyLogo } from "./CompanyLogo";

interface JobCardProps {
  job: Job;
  isHero?: boolean;
  hideDescription?: boolean;
  hideButtons?: boolean;
  showVpdPrompt?: boolean;
  onPrepare: (job: Job) => void;
  /** When true, show "Continue" instead of "Prepare" (application already has assets). */
  hasPreparedApplication?: boolean;
  onApply?: (job: Job) => void;
  onClick: (job: Job) => void;
  onVpdPromptClick?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  isHero = false,
  hideDescription = false,
  hideButtons = false,
  showVpdPrompt = false,
  onPrepare,
  hasPreparedApplication = false,
  onApply,
  onClick,
  onVpdPromptClick,
}) => {
  const { profileSetupRequired, promptProfileSetup } = useOnboardingGate();

  return (
    <div
      onClick={() => onClick(job)}
      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-brand-200/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/30"
    >
      {showVpdPrompt && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onVpdPromptClick?.(job);
          }}
          className="absolute right-2.5 top-2.5 z-20 flex h-3.5 w-3.5 items-center justify-center"
          title="Build your Value Proposition Document"
          aria-label="Build Value Proposition Document for this interview"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
      )}

      <div className="mb-0 flex gap-4">
        {/* Logo - Left */}
        <CompanyLogo
          logoUrl={job.logo}
          company={job.company}
          size="sm"
          className="border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        />

        {/* Text - Right */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900 dark:text-white leading-tight truncate text-base mb-1 group-hover:text-brand-600 transition-colors">
            {job.role}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1">{job.company}</span>
            <span>•</span>
            <span className="font-medium flex items-center gap-1">{job.location}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.isSponsoring && (
              <span
                title="This job explicitly mentions visa sponsorship"
                className="cursor-help rounded-md border border-yellow-300 bg-gradient-to-b from-amber-200 to-yellow-400 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-900 shadow-[0_1px_2px_rgba(251,191,36,0.2)] transition-all hover:brightness-105"
              >
                Visa
              </span>
            )}
            <span className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <Clock size={9} /> {job.postedDate}
            </span>
          </div>
        </div>

        {/* Job match score — hidden until backend match scoring is wired
        <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center">
          ...
        </div>
        */}
      </div>

      {/* Buttons - Conditional Render */}
      {!hideButtons && (
        <div className="mt-auto flex shrink-0 items-center gap-2 pt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              if (profileSetupRequired) {
                promptProfileSetup();
                return;
              }
              onPrepare(job);
            }}
            title={profileSetupRequired ? "Finish onboarding fully to prepare applications" : undefined}
            disabled={profileSetupRequired}
            className="relative flex-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasPreparedApplication ? "Continue" : "Prepare"}
            {showVpdPrompt && (
              <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </Button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (onApply) onApply(job);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-95"
          >
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
};

export default JobCard;
