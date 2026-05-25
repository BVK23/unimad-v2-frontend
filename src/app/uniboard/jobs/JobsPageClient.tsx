"use client";

import { Suspense } from "react";
import JobsMain from "@/components/jobs/JobsMain";
import { buildJobsSearchParams, parseJobsSearchParams, type InterviewView, type JobsTab } from "@/src/features/jobs/jobs-url";
import type { GeneratorContext } from "@/types/jobs";
import { useRouter, useSearchParams } from "next/navigation";

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlState = parseJobsSearchParams(searchParams);

  const handleNavigateToStudio = (context: GeneratorContext) => {
    const params = new URLSearchParams();
    if (context.jobId) params.set("jobId", context.jobId);
    if (context.company) params.set("company", context.company);
    if (context.role) params.set("role", context.role);
    if (context.type) params.set("type", context.type);
    if (context.assetId) params.set("id", context.assetId);
    if (context.description) params.set("description", context.description);
    if (context.recipientName) params.set("recipientName", context.recipientName);
    router.push(`/uniboard/studio?${params.toString()}`);
  };

  const updateJobsUrl = (
    updates: Partial<{
      tab: JobsTab | null;
      interview_id: string | null;
      view: InterviewView | null;
      round: string | null;
      setup: string | null;
    }>
  ) => {
    const href = `/uniboard/jobs${buildJobsSearchParams(searchParams, updates)}`;
    router.replace(href, { scroll: false });
  };

  const openSetupOnMount = searchParams.get("setup") === "1";

  return (
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
    />
  );
}

export default function JobsPageClient() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-slate-500 font-sans">Loading jobs…</div>}>
      <JobsPageContent />
    </Suspense>
  );
}
