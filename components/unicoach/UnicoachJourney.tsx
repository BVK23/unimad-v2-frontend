"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COACH_LATE_MILESTONES, COACH_MILESTONE_BY_UX_STAGE, COACH_SETTABLE_MILESTONES } from "@/constants/unicoach-journey-coach";
import {
  markCoachSectionRead,
  qk,
  useJourneyAdvanceMutation,
  useJourneyChecklistMutation,
  useSendCoachMessageMutation,
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
  isCallBookingUxStage,
  isStageCompleteForSidebar,
  maxUnlockedStageIndex,
  stageChecklistComplete,
} from "@/features/unicoach/mappers/journey-mapper";
import { switchUnicoachUser, updateUnicoachStudentMeta } from "@/features/unicoach/server-actions/unicoach-actions";
import type { JourneyChecklist } from "@/features/unicoach/types";
import { parseCoachData } from "@/features/unicoach/types";
import { resolveProfilePicture } from "@/features/unicoach/utils/profile-picture";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Lock,
  Minimize2,
  PlayCircle,
  Sparkles,
  Star,
  SendHorizontal,
  ChevronLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { UnicoachCoachDashboard } from "./UnicoachCoachDashboard";
import { UnicoachExecutionCalendar } from "./UnicoachExecutionCalendar";
import { UnicoachExecutionDashboard } from "./UnicoachExecutionDashboard";
import { UnicoachPartialPaymentCta } from "./UnicoachPartialPaymentCta";
import { UnicoachStageTasksCard } from "./UnicoachStageTasksCard";
import { UnicoachUpgradeGate } from "./UnicoachUpgradeGate";
import { UNICOACH_STAGES, videoUrlToEmbedSrc, type ContentTab, type UnicoachCurriculumStage } from "./curriculum";
import { UnicoachStage1NichePanel } from "./stage-content/UnicoachStage1NichePanel";
import { UnicoachStage1ResourcesPanel } from "./stage-content/UnicoachStage1ResourcesPanel";
import { UnicoachStage2PostCall1Panel } from "./stage-content/UnicoachStage2PostCall1Panel";
import { UnicoachStage3OverviewPanel, UnicoachStage3ResourcesPanel } from "./stage-content/UnicoachStage3Panel";
import { UnicoachStage4OverviewPanel } from "./stage-content/UnicoachStage4OverviewPanel";
import { UnicoachStage6OverviewPanel, UnicoachStage6ResourcesPanel } from "./stage-content/UnicoachStage6OverviewPanel";

const STAGES = UNICOACH_STAGES;

function linkedInPathLabel(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, "");
    return path.length > 36 ? `${path.slice(0, 34)}…` : path || "Profile";
  } catch {
    return "LinkedIn";
  }
}

const COACH_META_CLOSED_BY = [
  { value: "", label: "Not set" },
  { value: "sujan", label: "Sujan" },
  { value: "pooja", label: "Pooja" },
  { value: "suriya", label: "Suriya" },
  { value: "shaki", label: "Shaki" },
  { value: "neha", label: "Neha" },
] as const;

const COACH_META_MODE = [
  { value: "", label: "Not set" },
  { value: "1:1", label: "1:1" },
  { value: "webinar", label: "Webinar" },
  { value: "product", label: "Product" },
] as const;

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
    if (searchParams.get("view") !== "student") return null;
    const raw = searchParams.get("user_id");
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
  const sendMessageMutation = useSendCoachMessageMutation(commentSection, journeyUserId);
  const coachCallsMutation = useUpdateUnicoachStudentCallsMutation();

  const isCoachView = Boolean(coachTargetUserId);

  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [floatChatOpen, setFloatChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [advanceError, setAdvanceError] = useState("");
  const [maxSeenCommentId, setMaxSeenCommentId] = useState(0);

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
    if (totalTaskCount === 0) return [0, 0, 0] as [number, number, number];
    const cumThroughStage = (stageIndex: number) => STAGES.slice(0, stageIndex + 1).reduce((n, s) => n + s.tasks.length, 0);
    const idxCall1 = STAGES.findIndex(s => s.callMilestone === 1);
    const idxPost1 = STAGES.findIndex(s => s.id === "post-call-1");
    const idxPost2 = STAGES.findIndex(s => s.id === "post-call-2");
    const p1 = (cumThroughStage(idxCall1 >= 0 ? idxCall1 : 0) / totalTaskCount) * 100;
    const p2 = (cumThroughStage(idxPost1 >= 0 ? idxPost1 : 0) / totalTaskCount) * 100;
    const p3 = (cumThroughStage(idxPost2 >= 0 ? idxPost2 : 0) / totalTaskCount) * 100;
    const clamp = (x: number) => Math.min(100, Math.max(0, x));
    return [clamp(p1), clamp(p2), clamp(p3)] as [number, number, number];
  }, [totalTaskCount]);

  const allProgramTasksDone = useMemo(() => STAGES.every(s => stageChecklistComplete(checklist, s.id)), [checklist]);

  const prevCompletedCallsRef = useRef(completedCalls);
  const prevAllProgramDoneRef = useRef(allProgramTasksDone);

  useEffect(() => {
    if (completedCalls > prevCompletedCallsRef.current) {
      confetti({ particleCount: 130, spread: 72, origin: { y: 0.32 }, ticks: 220, scalar: 0.95 });
      confetti({ particleCount: 40, spread: 100, origin: { y: 0.28 }, angle: 120, shapes: ["star"], scalar: 0.85 });
    }
    prevCompletedCallsRef.current = completedCalls;
  }, [completedCalls]);

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

  const handleSendMessage = async () => {
    if (!chatDraft.trim() || !commentSection) return;
    try {
      await sendMessageMutation.mutateAsync(chatDraft.trim());
      setChatDraft("");
    } catch {
      /* ignore */
    }
  };

  const chatMessages = useMemo(() => {
    const rows = commentsData?.comments ?? [];
    const chronological = [...rows].reverse();
    const studentPeerId = journey?.chat_peers?.student?.id;
    return chronological.map(c => ({
      key: c.id,
      sender: studentPeerId != null && c.sender_id === studentPeerId ? ("student" as const) : ("coach" as const),
      text: c.message,
    }));
  }, [commentsData, journey?.chat_peers?.student?.id]);

  const showFloatingChat = Boolean(shouldLoadJourney && commentSection && journey);

  const viewerProfileIdForChat = journey?.viewer_profile_id ?? currentProfileId;

  const isFloatChatOpen = showFloatingChat && floatChatOpen;

  const unreadFloatingCount = useMemo(() => {
    if (isFloatChatOpen) return 0;
    const list = commentsData?.comments;
    if (!list?.length || viewerProfileIdForChat == null) return 0;
    return list.filter(c => c.sender_id !== viewerProfileIdForChat && c.id > maxSeenCommentId).length;
  }, [commentsData, viewerProfileIdForChat, maxSeenCommentId, isFloatChatOpen]);

  const openFloatingChat = useCallback(() => {
    setFloatChatOpen(true);
    if (!commentSection) return;
    void markCoachSectionRead(commentSection, journeyUserId);
    const rows = commentsData?.comments ?? [];
    if (rows.length) {
      setMaxSeenCommentId(prev => Math.max(prev, ...rows.map(c => c.id)));
    }
  }, [commentSection, journeyUserId, commentsData?.comments]);

  const coachFabAvatarUrl = useMemo(() => {
    if (isCoachAccount) {
      const c = init ? parseCoachData(init) : null;
      return c?.coach_profile_picture || null;
    }
    const fromJourney = journey?.chat_peers?.coach?.profile_picture;
    if (fromJourney?.trim()) return fromJourney.trim();
    const coaches = profile?.coaches;
    if (coaches && typeof coaches === "object") {
      const first = Object.values(coaches)[0];
      if (first?.profile_picture?.trim()) return first.profile_picture.trim();
    }
    return null;
  }, [isCoachAccount, init, journey?.chat_peers?.coach?.profile_picture, profile?.coaches]);

  const floatingChatAvatarUrl = useMemo(() => {
    if (coachTargetUserId && journey?.chat_peers?.student?.profile_picture?.trim()) {
      return journey.chat_peers.student.profile_picture.trim();
    }
    if (coachTargetUserId && journey?.journey_target_profile?.profile_picture?.trim()) {
      return journey.journey_target_profile.profile_picture.trim();
    }
    return coachFabAvatarUrl;
  }, [coachTargetUserId, journey, coachFabAvatarUrl]);

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
    const url = journey?.booking_url_for_stage;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
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

  const showBookingCta = Boolean(journeyFlags?.show_booking && journey?.booking_url_for_stage && isCallBookingUxStage(serverUx));

  const showAdvanceCta = Boolean(journey?.primary_action === "prepare_for_interview" && serverUx === "call-3");

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
  const activeStageTasksComplete = stageChecklistComplete(checklist, activeStage.id);

  const coachMilestoneEnabled = useMemo(() => {
    if (!isCoachView || !coachMilestone) return false;
    const tasksOk = coachMilestone.skipTaskGate || activeStageTasksComplete;
    if (!tasksOk) return false;
    switch (activeStage.id) {
      case "call-1-prep":
        return !c1.call_completed;
      case "post-call-1":
        return Boolean(c1.call_completed) && !c1.portfolio_completed;
      case "call-2":
        return Boolean(c1.portfolio_completed || c1.completed) && !c2.completed;
      case "complete":
        return !c3.completed;
      default:
        return false;
    }
  }, [isCoachView, coachMilestone, activeStage.id, activeStageTasksComplete, c1, c2, c3]);

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
  const call2DoneForCoach = Boolean(c2.completed);
  const studentUxStageLabel = STAGES.find(s => s.id === journey?.ux_stage)?.title ?? journey?.ux_stage ?? "";

  const showStudentAwaitingCoach =
    !isCoachView && activeStage.id === "post-call-1" && activeStageTasksComplete && Boolean(journeyFlags?.show_coach_working_on_portfolio);

  const programCompleted = Boolean((callsRaw as { program_completed?: boolean }).program_completed);
  const showPostCall3StudentCta = !isCoachView && activeStage.id === "complete" && Boolean(c3.completed) && !programCompleted;
  const showPostCall3CoachCta = isCoachView && activeStage.id === "complete" && Boolean(c3.completed) && !programCompleted;

  const showExecutionCalendar = activeStage.hasDashboard && (activeStage.id === "call-3" || activeStage.id === "complete");

  const handleSubscribeSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "init"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "profile-info"] });
  }, [queryClient]);

  const [metaDraft, setMetaDraft] = useState({ start: "", closedBy: "", mode: "" });
  const [metaEditing, setMetaEditing] = useState(false);
  const [switchingProfile, setSwitchingProfile] = useState(false);

  const savedMeta = useMemo(
    () => ({
      start: journey?.student_meta?.program_start_date ?? "",
      closedBy: journey?.student_meta?.closed_by ?? "",
      mode: journey?.student_meta?.conversion_mode ?? "",
    }),
    [journey?.student_meta]
  );

  const metaDirty = metaDraft.start !== savedMeta.start || metaDraft.closedBy !== savedMeta.closedBy || metaDraft.mode !== savedMeta.mode;

  const metaClosedByLabel = COACH_META_CLOSED_BY.find(o => o.value === savedMeta.closedBy)?.label ?? "Not set";
  const metaModeLabel = COACH_META_MODE.find(o => o.value === savedMeta.mode)?.label ?? "Not set";

  const formatMetaDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  useEffect(() => {
    if (!coachTargetUserId || !journey?.student_meta) return;
    const sm = journey.student_meta;
    const next = {
      start: sm.program_start_date ?? "",
      closedBy: sm.closed_by ?? "",
      mode: sm.conversion_mode ?? "",
    };
    queueMicrotask(() => setMetaDraft(next));
  }, [coachTargetUserId, journey?.student_meta]);

  const metaSaveMutation = useMutation({
    mutationFn: () =>
      updateUnicoachStudentMeta({
        userId: coachTargetUserId!,
        program_start_date: metaDraft.start || null,
        closed_by: metaDraft.closedBy || null,
        conversion_mode: metaDraft.mode || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.journey(journeyUserId) });
      setMetaEditing(false);
    },
  });

  const handleOpenStudentProfile = useCallback(async () => {
    const email = journey?.journey_target_profile?.email?.trim();
    if (!email) return;
    setSwitchingProfile(true);
    try {
      await switchUnicoachUser(email);
      window.location.reload();
    } catch {
      setSwitchingProfile(false);
    }
  }, [journey?.journey_target_profile?.email]);

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
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800 sm:h-[44px] sm:w-[44px]">
                      {journey.journey_target_profile.profile_picture ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external CDN avatars
                        <img
                          src={journey.journey_target_profile.profile_picture}
                          alt=""
                          className="h-full w-full object-cover"
                          width={44}
                          height={44}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
                          {(journey.journey_target_profile.name || "?").charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-white sm:text-xl">
                        {journey.journey_target_profile.name}
                      </h1>
                      <div className="mt-1.5 space-y-0.5 text-[11px] sm:text-xs">
                        {journey.journey_target_profile.email ? (
                          <a
                            href={`mailto:${journey.journey_target_profile.email}`}
                            className="block truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {journey.journey_target_profile.email}
                          </a>
                        ) : null}
                        {journey.journey_target_profile.phone_number ? (
                          <a
                            href={`tel:${journey.journey_target_profile.phone_number.replace(/[^\d+]/g, "")}`}
                            className="block truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {journey.journey_target_profile.phone_number}
                          </a>
                        ) : null}
                        {journey.journey_target_profile.linkedin_url ? (
                          <a
                            href={journey.journey_target_profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                          >
                            {linkedInPathLabel(journey.journey_target_profile.linkedin_url)}
                          </a>
                        ) : null}
                        <p className="text-slate-600 dark:text-slate-400">
                          {journey.journey_target_profile.location_display?.trim()
                            ? journey.journey_target_profile.location_display
                            : [journey.journey_target_profile.city, journey.journey_target_profile.country].filter(Boolean).join(", ") ||
                              "Location not set"}
                        </p>
                        {journey.journey_target_profile.role ? (
                          <p className="text-slate-600 dark:text-slate-300">{journey.journey_target_profile.role}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      <div className="flex h-full min-h-0 flex-col justify-center rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700 sm:min-w-[6.5rem]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">{completionPercent}%</p>
                      </div>
                      <div className="flex h-full min-h-0 flex-col justify-center rounded-lg border border-slate-200 px-2.5 py-2 dark:border-slate-700 sm:min-w-[6.5rem]">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Calls</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">{completedCalls}/3</p>
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <span
                        className="inline-flex max-w-[14rem] truncate rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
                        title="Student's current journey stage"
                      >
                        {studentUxStageLabel}
                      </span>
                      <label htmlFor="coach-milestone" className="sr-only">
                        Set coach milestone
                      </label>
                      <select
                        id="coach-milestone"
                        value={coachSettableMilestone}
                        onChange={e => void handleCoachMilestoneDropdownChange(e.target.value)}
                        disabled={coachCallsMutation.isPending}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-56 disabled:opacity-60"
                        title="Coach milestone — syncs with board columns. Stages 5–6 are set by student task progress."
                      >
                        {COACH_SETTABLE_MILESTONES.map(opt => {
                          const lateLocked = COACH_LATE_MILESTONES.has(opt.value) && !call2DoneForCoach;
                          return (
                            <option key={opt.value} value={opt.value} disabled={lateLocked}>
                              {opt.label}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleOpenStudentProfile()}
                        disabled={switchingProfile || !journey.journey_target_profile.email}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {switchingProfile ? "Opening…" : "Open profile"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Program details</p>
                    {!metaEditing ? (
                      <button
                        type="button"
                        onClick={() => setMetaEditing(true)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMetaDraft(savedMeta);
                          setMetaEditing(false);
                        }}
                        className="rounded-lg px-3 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {metaEditing ? (
                    <>
                      <dl className="grid gap-3 text-[11px] text-slate-600 dark:text-slate-400 sm:grid-cols-3">
                        <div className="space-y-1">
                          <dt className="font-medium text-slate-500 dark:text-slate-500">Start date</dt>
                          <dd>
                            <input
                              type="date"
                              value={metaDraft.start}
                              onChange={e => setMetaDraft(d => ({ ...d, start: e.target.value }))}
                              className="w-full max-w-[11rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="font-medium text-slate-500 dark:text-slate-500">Closed by</dt>
                          <dd>
                            <select
                              value={metaDraft.closedBy}
                              onChange={e => setMetaDraft(d => ({ ...d, closedBy: e.target.value }))}
                              className="w-full max-w-[11rem] rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            >
                              {COACH_META_CLOSED_BY.map(o => (
                                <option key={o.value || "none"} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="font-medium text-slate-500 dark:text-slate-500">Mode</dt>
                          <dd>
                            <select
                              value={metaDraft.mode}
                              onChange={e => setMetaDraft(d => ({ ...d, mode: e.target.value }))}
                              className="w-full max-w-[11rem] rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            >
                              {COACH_META_MODE.map(o => (
                                <option key={o.value || "none"} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => metaSaveMutation.mutate()}
                          disabled={!metaDirty || metaSaveMutation.isPending}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-600 dark:hover:bg-brand-700"
                        >
                          {metaSaveMutation.isPending ? "Saving…" : "Save program details"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <dl className="grid gap-3 text-[11px] text-slate-600 dark:text-slate-400 sm:grid-cols-3">
                      <div className="space-y-0.5">
                        <dt className="font-medium text-slate-500">Start date</dt>
                        <dd className="text-slate-800 dark:text-slate-200">{formatMetaDate(savedMeta.start)}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="font-medium text-slate-500">Closed by</dt>
                        <dd className="text-slate-800 dark:text-slate-200">{metaClosedByLabel}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className="font-medium text-slate-500">Mode</dt>
                        <dd className="text-slate-800 dark:text-slate-200">{metaModeLabel}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </>
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
                    <p className="text-lg font-medium text-slate-900 dark:text-white">{completedCalls}/3</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="relative flex h-10 w-full items-center">
                <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                {([1, 2, 3] as const).map((call, i) => {
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
              {[1, 2, 3].map(call => {
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
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-3 space-y-2">
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
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Stage {index + 1}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{stage.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </aside>

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
                  {(["overview", ...(activeStage.hasDashboard ? (["dashboard"] as const) : []), "resources"] as ContentTab[]).map(tab => (
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
                {activeTab === "overview" && activeStage.id === "call-1-prep" ? (
                  <UnicoachStage1NichePanel targetUserId={journeyUserId} readOnly={isCoachView} />
                ) : null}

                {activeTab === "overview" && activeStage.id === "post-call-1" ? <UnicoachStage2PostCall1Panel /> : null}

                {activeTab === "overview" && activeStage.id === "call-2" ? <UnicoachStage3OverviewPanel /> : null}

                {activeTab === "overview" && activeStage.id === "post-call-2" ? <UnicoachStage4OverviewPanel /> : null}

                {activeTab === "overview" && activeStage.id === "complete" ? <UnicoachStage6OverviewPanel /> : null}

                {activeTab === "overview" &&
                  activeStage.id !== "call-1-prep" &&
                  activeStage.id !== "post-call-1" &&
                  activeStage.id !== "call-2" &&
                  activeStage.id !== "post-call-2" &&
                  activeStage.id !== "complete" && (
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
                              <div className="px-3 pb-3 pl-9 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                                {section.body}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {activeTab === "dashboard" && activeStage.hasDashboard ? (
                  <UnicoachExecutionCalendar
                    tracker={journey?.execution_tracker}
                    includeStage6Items={activeStage.id === "complete"}
                    journeyUserId={journeyUserId}
                    readOnly={isCoachView}
                  />
                ) : null}

                {activeTab === "resources" && activeStage.id === "call-1-prep" ? (
                  <UnicoachStage1ResourcesPanel />
                ) : activeTab === "resources" && activeStage.id === "call-2" ? (
                  <UnicoachStage3ResourcesPanel />
                ) : activeTab === "resources" && activeStage.id === "complete" ? (
                  <UnicoachStage6ResourcesPanel />
                ) : activeTab === "resources" ? (
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
                              {resource.body && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">{resource.body}</p>
                              )}
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
                              {resource.videoUrl && !embedSrc && !resource.hasVideo && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 pl-7">
                                  Video link could not be embedded. Use a YouTube URL or paste an embed link from your host.
                                </p>
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

            <aside className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <UnicoachStageTasksCard
                  activeStage={activeStage}
                  serverUx={serverUx}
                  completedTaskIds={completedTaskIds}
                  tasksMeta={tasksMeta}
                  checklistMutationPending={checklistMutation.isPending}
                  onToggleTask={handleToggleTask}
                  showBookingCta={showBookingCta}
                  showAdvanceCta={showAdvanceCta}
                  advanceLabel={activeStage.nextActionLabel}
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
                  showStudentAwaitingCoach={showStudentAwaitingCoach}
                  showPostCall3StudentCta={showPostCall3StudentCta}
                  showPostCall3CoachCta={showPostCall3CoachCta}
                />
              </div>

              {showExecutionCalendar ? (
                <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <UnicoachExecutionDashboard
                    tracker={journey?.execution_tracker}
                    flags={journeyFlags}
                    includeInterviewPrep={activeStage.id === "complete"}
                    variant="sidebar"
                  />
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      {showFloatingChat ? (
        <>
          {!isFloatChatOpen ? (
            <button
              type="button"
              onClick={() => openFloatingChat()}
              className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800 shadow-lg transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a1a1a] dark:text-slate-100 dark:hover:bg-slate-900 md:bottom-6 md:right-6"
            >
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element -- external coach avatars */}
                <img
                  src={floatingChatAvatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-chat")}`}
                  alt=""
                  className="h-full w-full object-cover"
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                />
              </span>
              <span>Chat</span>
              {unreadFloatingCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadFloatingCount > 9 ? "9+" : unreadFloatingCount}
                </span>
              ) : null}
            </button>
          ) : null}
          {isFloatChatOpen ? (
            <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[min(520px,72vh)] max-h-[72vh] flex-col border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-[#141414] md:inset-x-auto md:bottom-6 md:right-6 md:h-[480px] md:max-h-[520px] md:w-[380px] md:rounded-2xl md:border md:shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-2">
                  {coachTargetUserId ? (
                    <div className="flex -space-x-2">
                      <span className="relative z-10 inline-block h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white dark:border-[#141414]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            journey?.chat_peers?.student?.profile_picture?.trim() ||
                            journey?.journey_target_profile?.profile_picture?.trim() ||
                            `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-student")}`
                          }
                          alt=""
                          className="h-full w-full object-cover"
                          width={32}
                          height={32}
                          referrerPolicy="no-referrer"
                        />
                      </span>
                      <span className="relative z-0 inline-block h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white dark:border-[#141414]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            coachFabAvatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-coach")}`
                          }
                          alt=""
                          className="h-full w-full object-cover"
                          width={32}
                          height={32}
                          referrerPolicy="no-referrer"
                        />
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          coachFabAvatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-coach")}`
                        }
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-600"
                        width={32}
                        height={32}
                        referrerPolicy="no-referrer"
                      />
                    </>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {coachTargetUserId ? (
                        <>
                          {journey?.journey_target_profile?.name ?? "Student"}
                          <span className="font-normal text-slate-400 dark:text-slate-500"> · coach</span>
                        </>
                      ) : (
                        "Coach chat"
                      )}
                    </p>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{activeStage.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloatChatOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
                {chatMessages.map(msg => {
                  const isCoachViewer = Boolean(isCoachAccount && coachTargetUserId);
                  const alignEnd = (isCoachViewer && msg.sender === "coach") || (!isCoachViewer && msg.sender === "student");
                  const st = journey?.chat_peers?.student;
                  const ch = journey?.chat_peers?.coach;
                  const studentPic =
                    resolveProfilePicture({
                      direct: st?.profile_picture ?? journey?.journey_target_profile?.profile_picture,
                    }) ?? "";
                  const coachPic =
                    resolveProfilePicture({
                      direct: ch?.profile_picture ?? coachFabAvatarUrl,
                    }) ?? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-coach")}`;
                  const showPic = msg.sender === "student" ? studentPic : coachPic;
                  const initial =
                    msg.sender === "student"
                      ? (st?.name || journey?.journey_target_profile?.name || "?").charAt(0)
                      : (ch?.name || (init ? parseCoachData(init)?.coach_name : null) || "C").charAt(0);
                  const tailCorner = alignEnd ? "rounded-br-md" : "rounded-bl-md";
                  return (
                    <div key={msg.key} className={`flex items-end gap-1.5 ${alignEnd ? "justify-end" : "justify-start"}`}>
                      {!alignEnd ? (
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
                          {showPic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={showPic}
                              alt=""
                              className="h-full w-full object-cover"
                              width={24}
                              height={24}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-slate-500">
                              {initial}
                            </span>
                          )}
                        </div>
                      ) : null}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs ${tailCorner} ${
                          msg.sender === "coach"
                            ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            : "bg-brand-600 text-white"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {alignEnd ? (
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
                          {showPic ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={showPic}
                              alt=""
                              className="h-full w-full object-cover"
                              width={24}
                              height={24}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-slate-500">
                              {initial}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatDraft}
                    onChange={event => setChatDraft(event.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={isCoachAccount ? "Message as coach…" : "Message your coach…"}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <SendHorizontal size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

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
