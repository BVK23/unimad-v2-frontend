"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import JobsMain from "@/components/jobs/JobsMain";
import { RouteNavigationOverlay } from "@/components/ui/RouteNavigationOverlay";
import type { PrepareApplicationTab } from "@/lib/jobs/prepare-application-return";
import { buildStudioHref } from "@/lib/jobs/prepare-application-url";
import { buildJobsSearchParams, parseJobsSearchParams, type InterviewView, type JobsTab } from "@/src/features/jobs/jobs-url";
import type { GeneratorContext } from "@/types/jobs";
import { useRouter, useSearchParams } from "next/navigation";

function isPrepareTab(type: string): type is PrepareApplicationTab {
  return type === "resume" || type === "cover-letter" || type === "cold-email" || type === "vpd";
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlState = parseJobsSearchParams(searchParams);
  const [isNavigating, startTransition] = useTransition();
  const [navMessage, setNavMessage] = useState<string | null>(null);

  const reopenPrepare = useMemo(() => {
    const jobId = urlState.prepareJob;
    if (!jobId) return null;
    const tabParam = urlState.prepareTab ?? "cover-letter";
    const tab: PrepareApplicationTab = isPrepareTab(tabParam) ? tabParam : "cover-letter";
    return { jobId, tab };
  }, [urlState.prepareJob, urlState.prepareTab]);

  const handleNavigateToStudio = (context: GeneratorContext) => {
    const message = context.openImproveMode
      ? "Opening Content Lab…"
      : context.type === "referral"
        ? "Opening Content Lab…"
        : "Loading Content Lab…";
    setNavMessage(message);
    startTransition(() => {
      router.push(
        buildStudioHref({
          id: context.assetId,
          type: context.type,
          jobId: context.jobId,
          navigate: context.navigate,
          improve: context.openImproveMode,
          interviewVpd: context.fromInterviewVpd,
        })
      );
    });
  };
  // Show overlay only while the navigation transition is pending.
  // We intentionally don't clear `navMessage` via an effect to satisfy lint rules.
  const showNavigationOverlay = isNavigating;

  const updateJobsUrl = (
    updates: Partial<{
      tab: JobsTab | null;
      interview_id: string | null;
      view: InterviewView | null;
      round: string | null;
      setup: string | null;
      prepareJob: string | null;
      prepareTab: string | null;
    }>
  ) => {
    const href = `/uniboard/jobs${buildJobsSearchParams(searchParams, updates)}`;
    router.replace(href, { scroll: false });
  };

  const handlePrepareReopened = () => {
    updateJobsUrl({ prepareJob: null, prepareTab: null });
  };

  const openSetupOnMount = searchParams?.get("setup") === "1";

  return (
    <>
      <JobsMain
        onNavigateToStudio={handleNavigateToStudio}
        activeTab={urlState.tab}
        onTabChange={tab => {
          updateJobsUrl({
            tab,
            interview_id: null,
            view: null,
            round: null,
            setup: null,
          });
        }}
        interviewUrl={{
          interviewId: urlState.interviewId,
          view: urlState.view,
          round: urlState.round,
          openSetupOnMount,
        }}
        onInterviewUrlChange={updates => {
          updateJobsUrl({ tab: "interview", ...updates });
        }}
        reopenPrepare={reopenPrepare}
        onPrepareReopened={handlePrepareReopened}
      />
      {showNavigationOverlay ? <RouteNavigationOverlay message={navMessage ?? "Loading…"} /> : null}
    </>
  );
}

export default function JobsPageClient() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-slate-500 font-sans">Loading jobs…</div>}>
      <JobsPageContent />
    </Suspense>
  );
}
