"use client";

import { VPD_FEATURE_ENABLED } from "@/constants/feature-flags";
import { LINKEDIN_COMMENT_EXTENSION_URL } from "@/features/linkedin/constants";
import type { ExecutionTracker, JourneyFlags } from "@/features/unicoach/types";
import { JOBS_BOARD_HREF, JOBS_INTERVIEW_HREF, JOBS_TRACKER_HREF } from "@/src/features/jobs/jobs-url";
import { CheckCircle2, Circle, ExternalLink, Target } from "lucide-react";
import Link from "next/link";

const TARGETS = {
  quality: 2,
  quantity: 10,
  connections: 25,
  comments: 5,
  posts: 3,
} as const;

type RowProps = {
  label: string;
  done: number;
  target: number;
  hint?: string;
  href?: string;
  external?: boolean;
};

function ProgressRow({ label, done, target, hint, href, external }: RowProps) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const complete = done >= target;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {complete ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
            {hint ? <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {done}/{target}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {href ? (
        external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Open tool
            <ExternalLink size={12} />
          </a>
        ) : (
          <Link
            href={href}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Open tool
            <ExternalLink size={12} />
          </Link>
        )
      ) : null}
    </div>
  );
}

type UnicoachExecutionDashboardProps = {
  tracker?: ExecutionTracker | null;
  flags?: JourneyFlags | null;
  includeInterviewPrep?: boolean;
  variant?: "main" | "sidebar";
};

export const UnicoachExecutionDashboard = ({ tracker, flags, includeInterviewPrep, variant = "main" }: UnicoachExecutionDashboardProps) => {
  const t = tracker ?? {};
  const qualityDone = t.quality_application_ids?.length ?? 0;
  const weekLabel = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const compact = variant === "sidebar";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{compact ? "Weekly targets" : "Execution dashboard"}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {compact ? "Use these tools to hit your rhythm." : `Week of ${weekLabel} — track outbound rhythm alongside stage tasks.`}
          </p>
        </div>
      </div>

      <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        <ProgressRow
          label="Quality applications"
          done={qualityDone}
          target={TARGETS.quality}
          hint="Use Prepare Application for each role."
          href={JOBS_BOARD_HREF}
        />
        <ProgressRow
          label="Quantity applications"
          done={t.quantity_applications_count ?? 0}
          target={TARGETS.quantity}
          href={JOBS_TRACKER_HREF}
        />
        <ProgressRow
          label="Connections"
          done={t.connections_count ?? 0}
          target={TARGETS.connections}
          href="/uniboard/linkedin#connection"
        />
        <ProgressRow
          label="Comments on posts"
          done={t.comments_count ?? 0}
          target={TARGETS.comments}
          href={LINKEDIN_COMMENT_EXTENSION_URL}
          external
        />
        <ProgressRow
          label="Posts (alternate days)"
          done={t.post_dates?.length ?? 0}
          target={TARGETS.posts}
          hint="Aim for at least one post every other day."
          href="/uniboard/studio?type=linkedin-post"
        />
        {includeInterviewPrep ? (
          <>
            <ProgressRow
              label="Interview prep"
              done={flags?.has_interview_stage_application ? 1 : 0}
              target={1}
              hint="Start from an Interview-stage application."
              href={JOBS_INTERVIEW_HREF}
            />
            <ProgressRow
              label="VPD work"
              done={0}
              target={1}
              hint={VPD_FEATURE_ENABLED ? "Generate and refine your value proposition." : "Coming soon — available after soft launch."}
              href={VPD_FEATURE_ENABLED ? "/uniboard/studio?type=vpd" : undefined}
            />
          </>
        ) : null}
      </div>

      {!compact ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tick daily items on the calendar; use the tools above to make progress on weekly targets.
        </p>
      ) : null}
    </div>
  );
};
