"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openUnicoachPricing } from "@/components/UnicoachPricingModal";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { VPD_FEATURE_ENABLED } from "@/constants/feature-flags";
import { COACH_MILESTONE_BY_UX_STAGE } from "@/constants/unicoach-journey-coach";
import {
  useJourneyAdvanceMutation,
  useJourneyChecklistMutation,
  useUnicoachComments,
  useUnicoachInit,
  useUnicoachJourneyState,
  useUnicoachProfileInfo,
  useUpdateUnicoachStudentCallsMutation,
} from "@/features/unicoach/hooks/use-uniboard-unicoach";
import {
  checklistToCompletedCompositeIds,
  callsCompletedCount,
  compositeIdToServerPayload,
  deriveCoachSettableMilestone,
  isStageCompleteForSidebar,
  maxUnlockedStageIndex,
  stageChecklistComplete,
} from "@/features/unicoach/mappers/journey-mapper";
import type { JourneyChecklist } from "@/features/unicoach/types";
import { startCoachActAsSession } from "@/lib/authed-fetch";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Lock, PlayCircle, Sparkles, Star, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UnicoachCoachDashboard } from "./UnicoachCoachDashboard";
import { UnicoachCoachStudentHeader } from "./UnicoachCoachStudentHeader";
import { UnicoachExecutionPanel } from "./UnicoachExecutionPanel";
import { UnicoachFloatingChat } from "./UnicoachFloatingChat";
import { UnicoachPartialPaymentCta } from "./UnicoachPartialPaymentCta";
import { UnicoachStageTasksCard } from "./UnicoachStageTasksCard";
import { UnicoachUpgradeGate } from "./UnicoachUpgradeGate";
import { UNICOACH_STAGES, videoUrlToEmbedSrc, type ContentTab, type UnicoachCurriculumStage } from "./curriculum";
import { UnicoachStage3ResourcesPanel } from "./stage-content/UnicoachStage3Panel";

const STAGES = UNICOACH_STAGES;

const isVpdStudioHref = (href: string) => href.includes("/uniboard/studio") && href.includes("type=vpd");

function OverviewSectionHref({ href, label }: { href: string; label: string }) {
  const vpdComingSoon = isVpdStudioHref(href) && !VPD_FEATURE_ENABLED;

  if (vpdComingSoon) {
    return (
      <span
        className="inline-flex cursor-not-allowed items-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500"
        title="Coming soon"
      >
        {label}
        <ComingSoonBadge label="soon" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
    >
      {label}
    </Link>
  );
}

const UnicoachJourney: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initQuery = useUnicoachInit();
  const init = initQuery.data;

  const isCoachAccount = Boolean(init?.coach_data);
  const isSubscribedStudent = init?.subscribed === true;

  const coachTargetUserId = useMemo(() => {
    if (!isCoachAccount) return null;
    if (searchParams?.get("view") !== "student") return null;
    const raw = searchParams?.get("user_id");
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return String(n);
  }, [isCoachAccount, searchParams]);

  const journeyUserId = coachTargetUserId;
  const shouldLoadJourney =
    Boolean(initQuery.isSuccess) && ((!isCoachAccount && isSubscribedStudent) || (isCoachAccount && Boolean(coachTargetUserId)));

  const journeyQuery = useUnicoachJourneyState(shouldLoadJourney, journeyUserId);
  const journey = journeyQuery.data;

  const profileQuery = useUnicoachProfileInfo(shouldLoadJourney, journeyUserId);
  const profile = profileQuery.data;

  const commentSection = journey?.comment_section ?? null;
  const commentsQuery = useUnicoachComments(commentSection, Boolean(shouldLoadJourney && commentSection), journeyUserId);
  const commentsData = commentsQuery.data;

  const checklistMutation = useJourneyChecklistMutation(journeyUserId);
  const advanceMutation = useJourneyAdvanceMutation(journeyUserId);
  const coachCallsMutation = useUpdateUnicoachStudentCallsMutation();

  const isCoachView = Boolean(coachTargetUserId);

  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [interviewConfirmOpen, setInterviewConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [advanceError, setAdvanceError] = useState("");
  const [coachExpandedStudentView, setCoachExpandedStudentView] = useState(false);

  const currentProfileId = useMemo(() => {
    const u = profile?.User;
    if (!u || typeof u !== "object") return null;
    const k = Object.keys(u)[0];
    return k ? Number(k) : null;
  }, [profile]);

  const checklist: JourneyChecklist = useMemo(() => {
    const raw = journey?.journey_checklist;
    return raw && typeof raw === "object" ? raw : {};
  }, [journey]);

  const completedTaskIds = useMemo(() => checklistToCompletedCompositeIds(checklist, STAGES), [checklist]);

  const serverUx = journey?.ux_stage ?? STAGES[0].id;

  useEffect(() => {
    if (!journey?.ux_stage) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setActiveStageId(journey.ux_stage);
    });
    return () => {
      cancelled = true;
    };
  }, [journey?.ux_stage]);

  const activeStage = STAGES.find(s => s.id === activeStageId) ?? STAGES[0];

  const maxUnlockedIdx = useMemo(
    () => maxUnlockedStageIndex(journey?.max_unlocked_stage ?? journey?.journey_flags?.max_unlocked_stage, STAGES),
    [journey?.max_unlocked_stage, journey?.journey_flags?.max_unlocked_stage]
  );
  const journeyFlags = journey?.journey_flags ?? null;
  const activeStageDef = journey?.stage_definitions?.[activeStage.id];
  const tasksMeta = activeStageDef?.tasks_meta;

  const totalTaskCount = STAGES.reduce((t, s) => t + s.tasks.length, 0);
  const completionPercent = totalTaskCount === 0 ? 0 : Math.round((completedTaskIds.length / totalTaskCount) * 100);

  const completedCalls = callsCompletedCount((journey?.calls ?? null) as Record<string, unknown> | null);

  const callMilestonePercents = useMemo(() => {
    if (totalTaskCount === 0) return [25, 50, 75, 100] as [number, number, number, number];
    const cumThroughStage = (stageIndex: number) => STAGES.slice(0, stageIndex + 1).reduce((n, s) => n + s.tasks.length, 0);
    const clamp = (x: number) => Math.min(100, Math.max(0, x));
    return STAGES.map((_, i) => clamp((cumThroughStage(i) / totalTaskCount) * 100)) as [number, number, number, number];
  }, [totalTaskCount]);

  const allProgramTasksDone = useMemo(() => STAGES.every(s => stageChecklistComplete(checklist, s.id)), [checklist]);

  const prevCompletedCallsRef = useRef(completedCalls);
  const prevAllProgramDoneRef = useRef(allProgramTasksDone);
  const prevStageCompleteRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (completedCalls > prevCompletedCallsRef.current) {
      confetti({ particleCount: 130, spread: 72, origin: { y: 0.32 }, ticks: 220, scalar: 0.95 });
      confetti({ particleCount: 40, spread: 100, origin: { y: 0.28 }, angle: 120, shapes: ["star"], scalar: 0.85 });
    }
    prevCompletedCallsRef.current = completedCalls;
  }, [completedCalls]);

  useEffect(() => {
    const prev = prevStageCompleteRef.current;
    for (const stage of STAGES) {
      const done = stageChecklistComplete(checklist, stage.id);
      const was = prev[stage.id] ?? false;
      if (done && !was) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.35 }, ticks: 200, scalar: 0.92 });
        confetti({ particleCount: 35, spread: 95, origin: { y: 0.3 }, angle: 110, shapes: ["star"], scalar: 0.8 });
      }
      prev[stage.id] = done;
    }
    prevStageCompleteRef.current = prev;
  }, [checklist]);

  useEffect(() => {
    if (allProgramTasksDone && !prevAllProgramDoneRef.current) {
      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.42 },
        ticks: 280,
        colors: ["#2563eb", "#eab308", "#22c55e", "#f8fafc"],
      });
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.38 },
        angle: 90,
        shapes: ["star"],
        scalar: 0.75,
        colors: ["#eab308", "#fbbf24"],
      });
    }
    prevAllProgramDoneRef.current = allProgramTasksDone;
  }, [allProgramTasksDone]);

  const isActiveStageFullyComplete = stageChecklistComplete(checklist, activeStage.id);

  const handleToggleTask = async (stageId: string, taskLabel: string) => {
    if (stageId !== serverUx) return;
    const payload = compositeIdToServerPayload(stageId, taskLabel, STAGES);
    if (!payload) return;
    const taskId = `${stageId}:${taskLabel}`;
    const checked = completedTaskIds.includes(taskId);
    try {
      await checklistMutation.mutateAsync({
        ...payload,
        completed: !checked,
      });
    } catch {
      /* mutation surfaces via isError if needed */
    }
  };

  const showFloatingChat = Boolean(shouldLoadJourney && commentSection && journey);

  const viewerProfileIdForChat = journey?.viewer_profile_id ?? currentProfileId;

  const accordionKey = (kind: "overview" | "resources", index: number) => `${activeStage.id}:${kind}:${index}`;
  const isAccordionOpen = (kind: "overview" | "resources", index: number) => accordionOpen[accordionKey(kind, index)] ?? index === 0;
  const toggleAccordion = (kind: "overview" | "resources", index: number) => {
    const key = accordionKey(kind, index);
    setAccordionOpen(prev => {
      const current = prev[key] ?? index === 0;
      return { ...prev, [key]: !current };
    });
  };

  const getStageStatus = (stage: UnicoachCurriculumStage, index: number) => {
    if (isCoachView) {
      if (stage.id === activeStage.id) return "active";
      if (isStageCompleteForSidebar(stage.id, journey?.calls as Record<string, unknown>, checklist, journeyFlags)) {
        return "complete";
      }
      return "unlocked";
    }
    if (index > maxUnlockedIdx) return "locked";
    if (isStageCompleteForSidebar(stage.id, journey?.calls as Record<string, unknown>, checklist, journeyFlags)) {
      return "complete";
    }
    if (stage.id === activeStage.id) return "active";
    return "unlocked";
  };

  const handleOpenBooking = () => {
    if (!isCoachView && activeStage.id === "call-1" && journey?.unicoach_access_level === "partial") {
      openUnicoachPricing();
      return;
    }
    const url = journey?.booking_url_for_stage;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else if (!isCoachView && activeStage.showBookingCta) openUnicoachPricing();
  };

  const handleConfirmInterview = async () => {
    setAdvanceError("");
    try {
      await advanceMutation.mutateAsync({ action: "confirm_interview_ready" });
      setInterviewConfirmOpen(false);
    } catch (e) {
      setAdvanceError(e instanceof Error ? e.message : "Could not confirm");
    }
  };

  const handleAdvance = async () => {
    if (!journey?.primary_action) return;
    setAdvanceError("");
    try {
      await advanceMutation.mutateAsync({ action: journey.primary_action });
    } catch (e) {
      setAdvanceError(e instanceof Error ? e.message : "Could not advance");
    }
  };

  const bookingStageId = journeyFlags?.booking_stage_id ?? null;
  const bookingStage = useMemo(() => (bookingStageId ? STAGES.find(s => s.id === bookingStageId) : undefined), [bookingStageId]);
  const bookingStageIndex = STAGES.findIndex(s => s.id === bookingStageId);
  const activeStageIndex = STAGES.findIndex(s => s.id === activeStage.id);
  const serverUxIndex = STAGES.findIndex(s => s.id === serverUx);
  const bookingAppliesToActiveStage = Boolean(
    bookingStageId &&
    (activeStage.id === bookingStageId ||
      activeStage.id === serverUx ||
      (bookingStageIndex >= 0 && activeStageIndex >= bookingStageIndex && serverUxIndex >= bookingStageIndex))
  );

  const showBookingCta = Boolean(
    !isCoachView && journeyFlags?.show_booking && journey?.booking_url_for_stage && bookingAppliesToActiveStage
  );

  const showBookingBlock = Boolean(
    !isCoachView && !journeyFlags?.show_booking && journeyFlags?.booking_block_reason && bookingAppliesToActiveStage
  );

  const showInterviewConfirmCta =
    !isCoachView &&
    activeStage.id === "call-4" &&
    serverUx === "call-4" &&
    Boolean(journeyFlags?.interview_confirm_enabled ?? journeyFlags?.prepare_for_interview_enabled);

  const showAdvanceCta = false;

  const advanceEnabled = Boolean(journeyFlags?.prepare_for_interview_enabled && isActiveStageFullyComplete);
  const advanceBlockReason = !journeyFlags?.has_interview_stage_application
    ? journeyFlags?.prepare_for_interview_block_reason
    : !isActiveStageFullyComplete
      ? "Complete all Stage 5 tasks first"
      : null;

  const coachMilestone = COACH_MILESTONE_BY_UX_STAGE[activeStage.id] ?? null;
  const callsRaw = (journey?.calls ?? {}) as Record<string, unknown>;
  const c1 = (callsRaw.call_1 ?? {}) as Record<string, unknown>;
  const c2 = (callsRaw.call_2 ?? {}) as Record<string, unknown>;
  const c3 = (callsRaw.call_3 ?? {}) as Record<string, unknown>;
  const c4 = (callsRaw.call_4 ?? {}) as Record<string, unknown>;
  const activeStageTasksComplete = stageChecklistComplete(checklist, activeStage.id);

  const coachMilestoneEnabled = useMemo(() => {
    if (!isCoachView || !coachMilestone) return false;
    const tasksOk = coachMilestone.skipTaskGate || activeStageTasksComplete;
    if (!tasksOk) return false;
    switch (activeStage.id) {
      case "call-1":
        return !c1.call_completed;
      case "call-2":
        return Boolean(c1.call_completed || c1.completed) && !c2.completed;
      case "call-3":
        return Boolean(c2.completed) && !c3.completed;
      case "call-4":
        return Boolean(c3.completed) && !c4.completed;
      default:
        return false;
    }
  }, [isCoachView, coachMilestone, activeStage.id, activeStageTasksComplete, c1, c2, c3, c4]);

  const handleCoachMilestone = useCallback(async () => {
    if (!coachTargetUserId || !coachMilestone) return;
    try {
      const result = await coachCallsMutation.mutateAsync({
        userId: Number(coachTargetUserId),
        targetStage: coachMilestone.targetStage,
      });
      if (result?.ux_stage) {
        setActiveStageId(result.ux_stage);
        setActiveTab("overview");
      }
    } catch {
      /* ignore */
    }
  }, [coachTargetUserId, coachMilestone, coachCallsMutation]);

  const handleCoachMilestoneDropdownChange = useCallback(
    async (targetStage: string) => {
      if (!coachTargetUserId) return;
      try {
        const result = await coachCallsMutation.mutateAsync({
          userId: Number(coachTargetUserId),
          targetStage,
        });
        if (result?.ux_stage) {
          setActiveStageId(result.ux_stage);
          setActiveTab("overview");
        }
      } catch {
        /* ignore */
      }
    },
    [coachTargetUserId, coachCallsMutation]
  );

  const coachSettableMilestone = useMemo(() => deriveCoachSettableMilestone(callsRaw), [callsRaw]);
  const showCoachCompactLayout = isCoachView && !coachExpandedStudentView;

  const showExecutionPanel = activeStage.hasDashboard && (activeStage.id === "call-2" || activeStage.id === "call-3");

  const handleSubscribeSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "init"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "profile-info"] });
  }, [queryClient]);

  const [switchingProfile, setSwitchingProfile] = useState(false);

  const handleOpenStudentProfile = useCallback(async () => {
    const profile = journey?.journey_target_profile;
    const studentId = coachTargetUserId ?? (profile?.id != null ? String(profile.id) : null);
    const name = profile?.name?.trim() || "Student";
    if (!studentId) return;
    setSwitchingProfile(true);
    try {
      console.info("[coach-act-as] open student profile", { studentId, name });
      await startCoachActAsSession(studentId, name);
      router.push("/uniboard/resume");
      router.refresh();
    } catch {
      setSwitchingProfile(false);
    }
  }, [coachTargetUserId, journey?.journey_target_profile, router]);

  if (initQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] min-h-[40vh]">
        <p className="text-sm text-slate-500">Loading Unicoach…</p>
      </div>
    );
  }

  if (initQuery.isError || init?.error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] min-h-[40vh] p-6">
        <p className="text-sm text-red-600 text-center">{init?.error ?? "Could not load Unicoach."}</p>
      </div>
    );
  }

  if (isCoachAccount && !coachTargetUserId) {
    return <UnicoachCoachDashboard init={init!} />;
  }

  if (!isCoachAccount && !isSubscribedStudent) {
    return <UnicoachUpgradeGate onPaymentSuccess={handleSubscribeSuccess} />;
  }

  if (journeyQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] min-h-[40vh]">
        <p className="text-sm text-slate-500">Loading your journey…</p>
      </div>
    );
  }

  if (journeyQuery.isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-[#0a0a0a] min-h-[40vh] p-6">
        <p className="text-sm text-red-600 text-center">{(journeyQuery.error as Error)?.message ?? "Journey unavailable."}</p>
        <button type="button" onClick={() => void journeyQuery.refetch()} className="rounded-xl bg-brand-600 text-white text-sm px-4 py-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
        <div className={`max-w-7xl mx-auto p-6 lg:p-8 space-y-6 ${showFloatingChat ? "pb-28" : ""}`}>
          {coachTargetUserId ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.replace("/uniboard/unicoach")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Back to all students"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                All students
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Student journey</span>
            </div>
          ) : null}
          {journey?.unicoach_access_level === "partial" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
              <UnicoachPartialPaymentCta />
            </div>
          ) : null}
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
            {coachTargetUserId && journey?.journey_target_profile ? (
              <UnicoachCoachStudentHeader
                profile={journey.journey_target_profile}
                journey={journey}
                coachTargetUserId={coachTargetUserId}
                completionPercent={completionPercent}
                completedCalls={completedCalls}
                callMilestonePercents={callMilestonePercents}
                coachSettableMilestone={coachSettableMilestone}
                onPipelineChange={v => void handleCoachMilestoneDropdownChange(v)}
                pipelinePending={coachCallsMutation.isPending}
                onOpenProfile={() => void handleOpenStudentProfile()}
                openingProfile={switchingProfile}
              />
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium mt-1">Unicoach Journey</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    No stage skipping. Complete mandatory tasks to unlock the next stage.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Program Progress</p>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">{completionPercent}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Calls Completed</p>
                    <p className="text-lg font-medium text-slate-900 dark:text-white">{completedCalls}/4</p>
                  </div>
                </div>
              </div>
            )}
            {!coachTargetUserId ? (
              <>
                <div className="mt-4">
                  <div className="relative flex h-10 w-full items-center">
                    <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    {([1, 2, 3, 4] as const).map((call, i) => {
                      const done = completedCalls >= call;
                      const left = callMilestonePercents[i];
                      return (
                        <div
                          key={call}
                          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${left}%` }}
                          title={
                            done
                              ? `Call ${call} prep milestone complete`
                              : `Call ${call} prep milestone — finish tasks up to here on the journey`
                          }
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ring-2 ring-white dark:ring-[#111] ${
                              done
                                ? "border-amber-300/90 bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 dark:border-amber-400/50 dark:from-amber-400/90 dark:via-yellow-300/80 dark:to-amber-500/90"
                                : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                            }`}
                          >
                            <Star
                              size={15}
                              className={done ? "text-amber-800 dark:text-amber-100" : "text-slate-300 dark:text-slate-500"}
                              fill={done ? "currentColor" : "none"}
                              strokeWidth={done ? 0 : 1.75}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {[1, 2, 3, 4].map(call => {
                    const done = call <= completedCalls;
                    return (
                      <div
                        key={call}
                        className={`px-2.5 py-1 rounded-full border ${
                          done
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                            : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        Call {call}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className={`space-y-2 ${showCoachCompactLayout ? "lg:col-span-4" : "lg:col-span-3"}`}>
              {STAGES.map((stage, index) => {
                const status = getStageStatus(stage, index);
                const lockedForStudent = index > maxUnlockedIdx;
                const isLocked = !isCoachView && lockedForStudent;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      if (isCoachView || !isLocked) {
                        setActiveStageId(stage.id);
                        setActiveTab("overview");
                      }
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      stage.id === activeStage.id
                        ? "border-brand-200 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111] dark:hover:bg-slate-900/50"
                    } ${isLocked ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {status === "complete" ? (
                          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : lockedForStudent ? (
                          <span title="Locked for student">
                            <Lock size={16} className="text-slate-400" aria-hidden />
                          </span>
                        ) : (
                          <Circle size={16} className="text-brand-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{stage.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </aside>

            {!showCoachCompactLayout ? (
              <section className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-medium text-slate-900 dark:text-white">{activeStage.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeStage.subtitle}</p>
                    </div>
                    {activeStage.isCallStage && (
                      <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] dark:border-amber-300/50 dark:from-amber-300/80 dark:via-yellow-300/80 dark:to-amber-500/80 dark:shadow-[0_0_18px_rgba(245,158,11,0.3)] overflow-hidden">
                        <span className="pointer-events-none absolute -left-10 top-0 h-full w-8 bg-white/45 blur-[0.5px] [transform:skewX(-20deg)] [animation:unicoachShine_10s_ease-in-out_infinite]" />
                        <Star size={14} className="relative z-10 text-amber-800 dark:text-amber-100" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["overview", "resources"] as ContentTab[]).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  {activeTab === "overview" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {activeStage.overview.map((section, index) => {
                          const open = isAccordionOpen("overview", index);
                          return (
                            <div
                              key={`${activeStage.id}-ov-${index}`}
                              className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => toggleAccordion("overview", index)}
                                className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                              >
                                <div className="flex items-start gap-2 min-w-0">
                                  <Sparkles size={16} className="text-brand-500 mt-0.5 shrink-0" />
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.title}</span>
                                </div>
                                {open ? (
                                  <ChevronUp size={16} className="text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
                                )}
                              </button>
                              {open && (
                                <div className="px-3 pb-3 pl-9 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-3">
                                  <p className="whitespace-pre-line">{section.body}</p>
                                  {section.href ? <OverviewSectionHref href={section.href} label={section.hrefLabel ?? "Open"} /> : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {showExecutionPanel ? (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                          <UnicoachExecutionPanel
                            executionStageId={activeStage.id === "call-2" ? "call-2" : "call-3"}
                            journeyUserId={journeyUserId}
                            readOnly={isCoachView}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === "resources" ? (
                    <div className="space-y-2">
                      {activeStage.resources.map((resource, index) => {
                        const open = isAccordionOpen("resources", index);
                        const embedSrc = resource.videoUrl ? videoUrlToEmbedSrc(resource.videoUrl) : null;
                        const showVideoPlaceholder = Boolean(resource.hasVideo && !embedSrc);
                        const hasVideoVisual = Boolean(embedSrc || resource.hasVideo || resource.videoUrl);
                        return (
                          <div
                            key={`${activeStage.id}-res-${index}`}
                            className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleAccordion("resources", index)}
                              className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <PlayCircle
                                  size={16}
                                  className={`mt-0.5 shrink-0 ${hasVideoVisual ? "text-brand-500" : "text-slate-400 dark:text-slate-500"}`}
                                />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{resource.title}</span>
                              </div>
                              {open ? (
                                <ChevronUp size={16} className="text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown size={16} className="text-slate-400 shrink-0" />
                              )}
                            </button>
                            {open && (
                              <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                {resource.title === "Sites to apply" ? (
                                  <div className="pl-7">
                                    <UnicoachStage3ResourcesPanel />
                                  </div>
                                ) : (
                                  <>
                                    {resource.body && (
                                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7 whitespace-pre-line">
                                        {resource.body}
                                      </p>
                                    )}
                                    {resource.href ? (
                                      <div className="pl-7">
                                        <Link
                                          href={resource.href}
                                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                        >
                                          {resource.hrefLabel ?? "Open"}
                                        </Link>
                                      </div>
                                    ) : null}
                                    {embedSrc && (
                                      <div className="pl-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-video">
                                        <iframe
                                          title={resource.title}
                                          src={embedSrc}
                                          className="h-full w-full"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                    )}
                                    {showVideoPlaceholder && (
                                      <div
                                        className="pl-7 aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
                                        aria-hidden
                                      >
                                        <PlayCircle size={28} strokeWidth={1.25} className="opacity-60" />
                                        <span className="text-xs font-medium uppercase tracking-wide">Video</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <aside className={`space-y-4 ${showCoachCompactLayout ? "lg:col-span-8" : "lg:col-span-3"}`}>
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <UnicoachStageTasksCard
                  activeStage={activeStage}
                  serverUx={serverUx}
                  completedTaskIds={completedTaskIds}
                  tasksMeta={tasksMeta}
                  checklistMutationPending={checklistMutation.isPending}
                  onToggleTask={handleToggleTask}
                  showBookingCta={showBookingCta}
                  showBookingBlock={showBookingBlock}
                  showAdvanceCta={showAdvanceCta}
                  advanceLabel={activeStage.nextActionLabel}
                  bookingActionLabel={bookingStage?.nextActionLabel ?? activeStage.nextActionLabel}
                  bookingBlockReason={journeyFlags?.booking_block_reason}
                  advanceBlockReason={advanceBlockReason}
                  isActiveStageFullyComplete={showAdvanceCta ? advanceEnabled : isActiveStageFullyComplete}
                  advancePending={advanceMutation.isPending}
                  onOpenBooking={handleOpenBooking}
                  onAdvance={() => void handleAdvance()}
                  advanceError={advanceError}
                  journeyFlags={journeyFlags}
                  isCoachView={isCoachView}
                  coachMilestone={coachMilestone}
                  coachMilestoneEnabled={coachMilestoneEnabled}
                  coachMilestonePending={coachCallsMutation.isPending}
                  onCoachMilestone={() => void handleCoachMilestone()}
                  showStudentAwaitingCoach={false}
                  showPostCall3StudentCta={false}
                  showPostCall3CoachCta={false}
                  showInterviewConfirmCta={showInterviewConfirmCta}
                  onConfirmInterview={() => setInterviewConfirmOpen(true)}
                  stageGateReason={activeStageDef?.stage_gate_reason}
                />
              </div>
              {showCoachCompactLayout && showExecutionPanel ? (
                <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <UnicoachExecutionPanel
                    executionStageId={activeStage.id === "call-2" ? "call-2" : "call-3"}
                    journeyUserId={journeyUserId}
                    readOnly={isCoachView}
                  />
                </div>
              ) : null}
              {showCoachCompactLayout ? (
                <button
                  type="button"
                  onClick={() => setCoachExpandedStudentView(true)}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-600 dark:bg-[#111] dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-300"
                >
                  View module content as student
                </button>
              ) : isCoachView ? (
                <button
                  type="button"
                  onClick={() => setCoachExpandedStudentView(false)}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-600 dark:bg-[#111] dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-300"
                >
                  Back to coach view
                </button>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      {interviewConfirmOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#111]">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ready for your interview prep call?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Confirm you have an interview scheduled and are ready to work on Interview Prep & VPD with your coach.
            </p>
            {advanceError ? <p className="mt-2 text-sm text-red-600">{advanceError}</p> : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setInterviewConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmInterview()}
                disabled={advanceMutation.isPending}
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {advanceMutation.isPending ? "Saving…" : "Yes, I'm ready"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <UnicoachFloatingChat
        enabled={showFloatingChat}
        commentSection={commentSection as string}
        journeyUserId={journeyUserId}
        isCoachView={isCoachView}
        viewerProfileId={viewerProfileIdForChat}
        studentPeerId={journey?.chat_peers?.student?.id ?? null}
        chatPeers={journey?.chat_peers}
        profile={profile}
        init={init}
        journeyTargetProfile={journey?.journey_target_profile}
        comments={commentsData?.comments ?? []}
      />

      <style jsx>{`
        @keyframes unicoachShine {
          0% {
            transform: translateX(0) skewX(-20deg);
            opacity: 0;
          }
          6% {
            transform: translateX(56px) skewX(-20deg);
            opacity: 0.9;
          }
          12% {
            transform: translateX(72px) skewX(-20deg);
            opacity: 0;
          }
          100% {
            transform: translateX(72px) skewX(-20deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default UnicoachJourney;
