"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import type { OpenPrepareApplicationOptions } from "@/lib/jobs/open-prepare-application";
import type { PrepareApplicationTab } from "@/lib/jobs/prepare-application-return";
import { resolveJobForPrepareReopen } from "@/lib/jobs/resolve-prepare-reopen-job";
import type { InterviewAutoStart, InterviewPrepContext, StartInterviewFromJobPayload } from "@/src/features/interview-prep/types";
import type { InterviewView, JobsTab } from "@/src/features/jobs/jobs-url";
import { Search, Map, Mic2 } from "lucide-react";
import { GeneratorContext, Job } from "../../types/jobs";
import ApplicationTracker from "./ApplicationTracker";
import InterviewPrep from "./InterviewPrep";
import JobDiscovery from "./JobDiscovery";
import PrepareApplicationModal, { type PrepareModalSource } from "./PrepareApplicationModal";

interface InterviewUrlState {
  interviewId: string | null;
  view: InterviewView | null;
  round: string | null;
  openSetupOnMount?: boolean;
}

interface JobsMainProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
  activeTab: JobsTab;
  onTabChange: (tab: JobsTab) => void;
  interviewUrl: InterviewUrlState;
  onInterviewUrlChange: (
    updates: Partial<{
      interview_id: string | null;
      view: InterviewView | null;
      round: string | null;
      setup: string | null;
    }>
  ) => void;
  reopenPrepare?: { jobId: string; tab: PrepareApplicationTab } | null;
  onPrepareReopened?: () => void;
}

const JobsMain: React.FC<JobsMainProps> = ({
  onNavigateToStudio,
  activeTab,
  onTabChange,
  interviewUrl,
  onInterviewUrlChange,
  reopenPrepare,
  onPrepareReopened,
}) => {
  const { data: applications = [], isLoading: applicationsLoading } = useApplications();
  const [interviewPrepContext, setInterviewPrepContext] = useState<InterviewPrepContext | null>(null);
  const [interviewAutoStart, setInterviewAutoStart] = useState<InterviewAutoStart | null>(null);
  const [prepareModalJob, setPrepareModalJob] = useState<Job | null>(null);
  const [prepareModalSource, setPrepareModalSource] = useState<PrepareModalSource>("discovery");
  const [prepareModalTab, setPrepareModalTab] = useState<PrepareApplicationTab>("resume");
  const goToTracker = () => onTabChange("tracker");

  const handleOpenPrepareApplication = useCallback((job: Job, options: OpenPrepareApplicationOptions) => {
    setPrepareModalJob(job);
    setPrepareModalSource(options.source);
    setPrepareModalTab(options.tab ?? "resume");
  }, []);

  useEffect(() => {
    if (!reopenPrepare?.jobId || applicationsLoading) return;

    let cancelled = false;

    void (async () => {
      const resolved = await resolveJobForPrepareReopen(reopenPrepare.jobId, applications);
      if (cancelled || !resolved) return;

      setPrepareModalJob(resolved.job);
      setPrepareModalSource(resolved.source);
      setPrepareModalTab(reopenPrepare.tab);
      onPrepareReopened?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [reopenPrepare, applications, applicationsLoading, onPrepareReopened]);

  const jobDescriptionForInterview = (job: StartInterviewFromJobPayload["job"]) =>
    job.description?.trim() || `${job.role} at ${job.company}`;

  const openInterviewPrepSetup = (job: StartInterviewFromJobPayload["job"]) => {
    setInterviewPrepContext({
      company: job.company,
      role: job.role,
      jobDescription: jobDescriptionForInterview(job),
      applicationId: job.id,
    });
    setInterviewAutoStart(null);
    onTabChange("interview");
    onInterviewUrlChange({ setup: "1", view: "setup", interview_id: null, round: null });
  };

  const startInterviewFromJob = (payload: StartInterviewFromJobPayload) => {
    setInterviewPrepContext({
      company: payload.job.company,
      role: payload.job.role,
      jobDescription: jobDescriptionForInterview(payload.job),
      applicationId: payload.applicationId ?? payload.job.id,
    });
    setInterviewAutoStart({ roundType: payload.roundType, mode: payload.mode });
    onTabChange("interview");
    onInterviewUrlChange({
      setup: null,
      view: payload.mode === "live" ? "voice" : null,
      interview_id: null,
      round: payload.roundType,
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-slate-50 font-sans dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-medium leading-none tracking-tight text-slate-900 dark:text-white">Jobs & Career</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Find, apply, and prepare for your dream role</p>
          </div>

          <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => onTabChange("discovery")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                activeTab === "discovery"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Search size={14} /> Discovery
            </button>
            <button
              type="button"
              onClick={() => onTabChange("tracker")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                activeTab === "tracker"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Map size={14} /> Tracker
            </button>
            <button
              type="button"
              onClick={() => {
                setInterviewPrepContext(null);
                onInterviewUrlChange({ setup: null, view: null, interview_id: null, round: null });
                onTabChange("interview");
              }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                activeTab === "interview"
                  ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Mic2 size={14} /> Interview Prep
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {activeTab === "discovery" && (
          <JobDiscovery
            onNavigateToStudio={onNavigateToStudio}
            onGoToTracker={goToTracker}
            onStartInterviewPrep={startInterviewFromJob}
            onOpenPrepareApplication={handleOpenPrepareApplication}
          />
        )}
        {activeTab === "tracker" && (
          <ApplicationTracker
            onNavigateToStudio={onNavigateToStudio}
            onStartInterviewPrep={openInterviewPrepSetup}
            onOpenPrepareApplication={handleOpenPrepareApplication}
          />
        )}
        {activeTab === "interview" && (
          <InterviewPrep
            initialContext={interviewPrepContext}
            autoStart={interviewAutoStart}
            onAutoStartConsumed={() => setInterviewAutoStart(null)}
            urlInterviewId={interviewUrl.interviewId}
            urlView={interviewUrl.view}
            urlRound={interviewUrl.round}
            openSetupOnMount={interviewUrl.openSetupOnMount}
            onUrlChange={onInterviewUrlChange}
          />
        )}
      </div>

      {prepareModalJob && (
        <PrepareApplicationModal
          job={prepareModalJob}
          source={prepareModalSource}
          initialTab={prepareModalTab}
          onClose={() => setPrepareModalJob(null)}
          onNavigateToStudio={onNavigateToStudio}
          onStartInterviewPrep={startInterviewFromJob}
        />
      )}
    </div>
  );
};

export default JobsMain;
