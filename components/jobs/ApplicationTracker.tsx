"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { VPD_FEATURE_ENABLED } from "@/constants/feature-flags";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import { createApplication, updateApplication } from "@/features/application-tracker/server-actions/application-actions";
import type { Application, ApplicationStatus, CreateApplicationInput } from "@/features/application-tracker/types";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { needsProfileSetup, onboardingHref } from "@/features/onboarding/featureGates";
import {
  activateInterviewVpdPrompt,
  buildInterviewVpdStudioContext,
  dismissInterviewVpdPrompt,
  shouldShowInterviewVpdPrompt,
  syncInterviewVpdPrompts,
} from "@/lib/jobs/interview-vpd-prompt";
import { applicationToJob } from "@/lib/jobs/job-ui-mappers";
import type { OpenPrepareApplicationOptions } from "@/lib/jobs/open-prepare-application";
import type { StartInterviewFromJobPayload } from "@/src/features/interview-prep/types";
import type { GeneratorContext, Job } from "@/types/jobs";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ApplicationManager from "./ApplicationManager";
import InterviewingStageModal from "./InterviewingStageModal";
import JobCard from "./JobCard";

const TRACKER_ONBOARDING_DISMISS_KEY = "unimad_tracker_onboarding_prompt_dismissed";

interface TrackerColumnProps {
  title: string;
  status: ApplicationStatus;
  statusColor: string;
  columnApps: Application[];
  showAddApplication?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: ApplicationStatus) => void;
  onAddClick: (status: ApplicationStatus) => void;
  onViewApplication: (app: Application) => void;
  onPrepareJob: (job: Job) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  showVpdPromptForJob?: (job: Job) => boolean;
  onVpdPromptClick?: (job: Job) => void;
}

function TrackerColumn({
  title,
  status,
  statusColor,
  columnApps,
  showAddApplication = false,
  onDragOver,
  onDrop,
  onAddClick,
  onViewApplication,
  onPrepareJob,
  onDragStart,
  onDragEnd,
  showVpdPromptForJob,
  onVpdPromptClick,
}: TrackerColumnProps) {
  return (
    <div
      className="drag-target flex h-full min-w-[320px] max-w-[400px] flex-1 shrink-0 flex-col rounded-3xl border border-slate-100 bg-slate-50/50 p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/20"
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, status)}
    >
      <div className="mb-3 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <h3 className="text-base font-medium text-slate-900 dark:text-white">{title}</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {columnApps.length}
          </span>
        </div>
      </div>

      {showAddApplication && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => onAddClick(status)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-3 text-xs font-medium text-slate-400 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
          >
            <Plus size={14} /> Add Application
          </button>
        </div>
      )}

      <div className="scrollbar-on-hover flex-1 space-y-3 overflow-y-auto pb-2 pr-1">
        {columnApps.map(app => {
          const job = applicationToJob(app);
          return (
            <div
              key={app.application_id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData("applicationId", app.application_id);
                onDragStart();
              }}
              onDragEnd={onDragEnd}
              className="mb-3 block cursor-grab active:cursor-grabbing"
            >
              <JobCard
                job={job}
                hideDescription
                hideButtons
                showVpdPrompt={status === "interviewing" && (showVpdPromptForJob?.(job) ?? false)}
                onClick={() => onViewApplication(app)}
                onPrepare={() => onPrepareJob(job)}
                onApply={() => {}}
                onVpdPromptClick={onVpdPromptClick}
              />
            </div>
          );
        })}
        {columnApps.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400 dark:border-slate-800">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

interface ApplicationTrackerProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
  onStartInterviewPrep?: (payload: StartInterviewFromJobPayload) => void;
  onOpenPrepareApplication?: (job: Job, options?: OpenPrepareApplicationOptions) => void;
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ onNavigateToStudio, onStartInterviewPrep, onOpenPrepareApplication }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { featureGates } = useOnboardingGate();
  const { data: applications = [], isLoading } = useApplications();
  const needsOnboarding = needsProfileSetup(featureGates);
  const interviewPrepGated = !featureGates.jobs_prepare_application;

  const [addModalInitialStatus, setAddModalInitialStatus] = useState<ApplicationStatus>("applied");
  const [tabState, setTabState] = useState<"toAdd" | "toView" | "toEdit" | "">("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [draftsCollapsed, setDraftsCollapsed] = useState(false);
  const [interviewingPromptJob, setInterviewingPromptJob] = useState<Job | null>(null);
  const [vpdPromptTick, setVpdPromptTick] = useState(0);
  const [onboardingPromptDismissed, setOnboardingPromptDismissed] = useState(false);
  const trackerJobs = useMemo(() => applications.map(applicationToJob), [applications]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(TRACKER_ONBOARDING_DISMISS_KEY) === "1") {
        setOnboardingPromptDismissed(true);
      }
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  const dismissOnboardingPrompt = () => {
    setOnboardingPromptDismissed(true);
    try {
      sessionStorage.setItem(TRACKER_ONBOARDING_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const showOnboardingPrompt = needsOnboarding && !onboardingPromptDismissed;

  const openPrepare = (job: Job, tab?: OpenPrepareApplicationOptions["tab"]) => {
    onOpenPrepareApplication?.(job, { source: "tracker", tab });
  };

  useEffect(() => {
    syncInterviewVpdPrompts(trackerJobs);
    setVpdPromptTick(t => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync persisted prompts once on mount
  }, []);

  const showVpdPromptForJob = (job: Job) => {
    void vpdPromptTick;
    return shouldShowInterviewVpdPrompt(job);
  };

  const handleOpenInterviewVpd = (job: Job) => {
    if (!VPD_FEATURE_ENABLED) return;
    onNavigateToStudio(buildInterviewVpdStudioContext(job));
  };

  const moveApplicationToStatus = async (applicationId: string, newStatus: ApplicationStatus, dropEvent?: React.DragEvent) => {
    const app = applications.find(a => a.application_id === applicationId);
    if (!app || app.status === newStatus) return;

    const previousList = [...applications];
    queryClient.setQueryData(
      ["applications"],
      previousList.map(a => (a.application_id === applicationId ? { ...a, status: newStatus } : a))
    );

    try {
      await updateApplication(applicationId, { ...app, status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });

      if (newStatus === "interviewing" && app.status !== "interviewing") {
        activateInterviewVpdPrompt(applicationId);
        setVpdPromptTick(t => t + 1);
        if (VPD_FEATURE_ENABLED) {
          setInterviewingPromptJob(applicationToJob({ ...app, status: newStatus }));
        }
      }

      if (app.status === "interviewing" && newStatus === "applied") {
        dismissInterviewVpdPrompt(applicationId);
        setVpdPromptTick(t => t + 1);
      }

      if (newStatus === "offered" && dropEvent) {
        const x = dropEvent.clientX / window.innerWidth;
        const y = dropEvent.clientY / window.innerHeight;
        confetti({ particleCount: 100, spread: 70, origin: { x, y } });
      }
    } catch (err) {
      console.error("Failed to update application status:", err);
      queryClient.setQueryData(["applications"], previousList);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData("applicationId");
    if (!applicationId) return;

    await moveApplicationToStatus(applicationId, newStatus, e);
    setIsDragging(false);

    if (newStatus === "rejected") {
      setIsTrashing(true);
      window.setTimeout(() => setIsTrashing(false), 500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    setTabState("toView");
  };

  const handleAddClick = (initialStatus: ApplicationStatus = "applied") => {
    setAddModalInitialStatus(initialStatus);
    setTabState("toAdd");
  };

  const handleCloseModal = () => {
    setTabState("");
    setSelectedApplication(null);
  };

  const handleAddSubmit = async (data: CreateApplicationInput) => {
    try {
      await createApplication(data);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create application:", err);
    }
  };

  const handleCardUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
    setSelectedApplication(null);
    setTabState("");
  };

  const handlePrepareFromDetails = (app: Application) => {
    setTabState("");
    setSelectedApplication(null);
    setShowRejectedModal(false);
    openPrepare(applicationToJob(app));
  };

  const isViewingApplicationDetail = tabState === "toView" || tabState === "toEdit";
  const showRejectedListModal = showRejectedModal && !isViewingApplicationDetail;

  const handleStatusChangeFromDetails = async (applicationId: string, newStatus: ApplicationStatus) => {
    const app = applications.find(a => a.application_id === applicationId);
    if (!app) return;
    await moveApplicationToStatus(applicationId, newStatus);
    setSelectedApplication(prev => (prev && prev.application_id === applicationId ? { ...prev, status: newStatus } : prev));
  };

  const appsByStatus = useMemo(() => {
    const map = new Map<ApplicationStatus, Application[]>();
    (["draft", "applied", "interviewing", "offered", "rejected"] as ApplicationStatus[]).forEach(s => map.set(s, []));
    applications.forEach(app => {
      const list = map.get(app.status);
      if (list) list.push(app);
    });
    return map;
  }, [applications]);

  const draftApps = appsByStatus.get("draft") ?? [];
  const rejectedApps = appsByStatus.get("rejected") ?? [];

  const columnProps = {
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onAddClick: handleAddClick,
    onViewApplication: handleViewApplication,
    onPrepareJob: (job: Job) => openPrepare(job),
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    showVpdPromptForJob,
    onVpdPromptClick: handleOpenInterviewVpd,
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-4">
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-w-0 flex-1 overflow-hidden p-4">
      <div className="absolute right-4 top-0 z-10 flex items-center gap-3 p-2">
        <div
          className={`z-50 flex items-center justify-center rounded-xl px-4 py-2 shadow-sm transition-all duration-300 ${
            isDragging
              ? "min-w-[140px] scale-105 border-2 border-red-500 bg-white text-red-600 shadow-lg shadow-red-500/10 dark:bg-slate-900"
              : isTrashing
                ? "scale-110 border-2 border-red-500 bg-red-50/50 text-red-600 shadow-red-500/20 dark:bg-red-900/10"
                : "scale-100 cursor-pointer border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, "rejected")}
          onClick={() => !isDragging && setShowRejectedModal(true)}
        >
          <Trash2 size={16} className={`${isDragging ? "mr-2 animate-bounce" : ""} ${isTrashing ? "animate-pulse" : ""}`} />
          {!isDragging && <span className="ml-2 text-sm font-medium">Rejected</span>}
          {isDragging && <span className="whitespace-nowrap text-sm font-medium">Drop to Reject</span>}
        </div>
      </div>

      <div className="scrollbar-on-hover flex h-full w-full gap-4 overflow-x-auto pb-4 pr-16 pt-14">
        {draftsCollapsed ? (
          <button
            type="button"
            onClick={() => setDraftsCollapsed(false)}
            className="drag-target flex h-full w-14 shrink-0 flex-col items-center rounded-3xl border border-slate-200 bg-slate-100/80 py-4 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, "draft")}
            title="Expand drafts"
          >
            <ChevronRight size={18} className="mb-3 text-slate-500" />
            <span
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-400"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Drafts
            </span>
            <span className="mt-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {draftApps.length}
            </span>
          </button>
        ) : (
          <div className="relative flex h-full min-w-[280px] max-w-[320px] shrink-0 flex-col">
            <button
              type="button"
              onClick={() => setDraftsCollapsed(true)}
              className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Collapse drafts"
              aria-label="Collapse drafts column"
            >
              <ChevronLeft size={18} />
            </button>
            <TrackerColumn
              title="Drafts"
              status="draft"
              statusColor="bg-amber-400"
              columnApps={draftApps}
              showAddApplication
              {...columnProps}
            />
          </div>
        )}

        <TrackerColumn
          title="Applied"
          status="applied"
          statusColor="bg-slate-400 dark:bg-slate-500"
          columnApps={appsByStatus.get("applied") ?? []}
          showAddApplication
          {...columnProps}
        />
        <TrackerColumn
          title="Interviewing"
          status="interviewing"
          statusColor="bg-brand-500"
          columnApps={appsByStatus.get("interviewing") ?? []}
          {...columnProps}
        />
        <TrackerColumn
          title="Offers"
          status="offered"
          statusColor="bg-green-500"
          columnApps={appsByStatus.get("offered") ?? []}
          {...columnProps}
        />
      </div>

      <ApplicationManager
        isOpen={tabState === "toAdd" || tabState === "toView" || tabState === "toEdit"}
        handleClose={handleCloseModal}
        tabState={tabState}
        setTabState={setTabState}
        selectedApplication={selectedApplication}
        setSelectedApplication={setSelectedApplication}
        onAdd={handleAddSubmit}
        handleCardUpdate={handleCardUpdate}
        initialStatusForAdd={addModalInitialStatus}
        onPrepare={handlePrepareFromDetails}
        onStatusChange={handleStatusChangeFromDetails}
      />

      {interviewingPromptJob && (
        <InterviewingStageModal
          job={interviewingPromptJob}
          onClose={() => setInterviewingPromptJob(null)}
          interviewPrepDisabled={interviewPrepGated}
          onBuildVpd={() => {
            const job = interviewingPromptJob;
            setInterviewingPromptJob(null);
            onNavigateToStudio(buildInterviewVpdStudioContext(job));
          }}
          onStartInterviewPrep={({ roundType, mode }) => {
            const job = interviewingPromptJob;
            setInterviewingPromptJob(null);
            if (!job) return;
            onStartInterviewPrep?.({
              job,
              roundType,
              mode,
              applicationId: job.id,
            });
          }}
        />
      )}

      {showRejectedListModal && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-white">
                <Trash2 className="text-red-500" /> Rejected
              </h2>
              <button
                type="button"
                onClick={() => setShowRejectedModal(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreHorizontal size={24} />
              </button>
            </div>
            <div className="scrollbar-on-hover flex-1 space-y-3 overflow-y-auto pr-2">
              {rejectedApps.length > 0 ? (
                rejectedApps.map(app => {
                  const job = applicationToJob(app);
                  return (
                    <JobCard
                      key={app.application_id}
                      job={job}
                      hideDescription
                      hideButtons
                      onClick={() => handleViewApplication(app)}
                      onPrepare={() => openPrepare(job)}
                      onApply={() => {}}
                    />
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400">No rejected jobs. Your pipeline is looking healthy!</div>
              )}
            </div>
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRejectedModal(false)}
                className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {showOnboardingPrompt ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracker-onboarding-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 id="tracker-onboarding-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Finish setting up your profile
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Complete onboarding so Prepare Application and interview prep can use your background. You can keep using your tracker in the
              meantime.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={dismissOnboardingPrompt}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissOnboardingPrompt();
                  router.push(onboardingHref("profile_setup"));
                }}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
              >
                Finish onboarding
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ApplicationTracker;
