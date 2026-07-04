"use client";

import React, { useCallback, useMemo, useState } from "react";
import { buildMountainDemoStudents, isMountainDemoUserId } from "@/constants/unicoach-coach-mountain-demo";
import { COACH_PIPELINE_LABELS, COACH_PIPELINE_ORDER, type CoachPipelineStage } from "@/constants/unicoach-coach-pipeline";
import { useUnicoachStudentsByStage, useUpdateUnicoachStudentCallsMutation } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import { fetchUserDataForPaymentPrefill } from "@/features/unicoach/server-actions/unicoach-actions";
import type { AssignedStudent, UnicoachInitResponse } from "@/features/unicoach/types";
import { parseCoachData } from "@/features/unicoach/types";
import { clearCoachActAsSession } from "@/lib/authed-fetch";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { type CoachMountainStudent, UnicoachCoachJourneyMountain } from "./UnicoachCoachJourneyMountain";
import { UnicoachCoachStudentCards } from "./UnicoachCoachStudentCards";

export type UnicoachCoachDashboardProps = {
  init: UnicoachInitResponse;
};

function isCoachPipelineStage(key: string): key is CoachPipelineStage {
  return (COACH_PIPELINE_ORDER as readonly string[]).includes(key);
}

function stageKeyForUser(stages: Record<string, AssignedStudent[]>, userId: number): CoachPipelineStage {
  for (const [key, list] of Object.entries(stages)) {
    if (list.some(u => u.id === userId) && isCoachPipelineStage(key)) return key;
  }
  return "not_started";
}

export const UnicoachCoachDashboard: React.FC<UnicoachCoachDashboardProps> = ({ init }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mountainDemoMode = searchParams.get("mountain_demo") === "1";
  const [isSwitchingCoach, setIsSwitchingCoach] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageOverrides, setStageOverrides] = useState<Record<number, CoachPipelineStage>>({});
  const [demoStageOverrides, setDemoStageOverrides] = useState<Record<number, CoachPipelineStage>>({});
  const [moveError, setMoveError] = useState<string | null>(null);

  const coach = useMemo(() => parseCoachData(init), [init]);
  const { data: sessionPrefill } = useQuery({
    queryKey: ["unicoach", "session-user-prefill"],
    queryFn: () => fetchUserDataForPaymentPrefill(),
    staleTime: 120_000,
  });
  const sessionEmail = sessionPrefill?.email ?? null;

  const {
    data: stagesData,
    isLoading,
    isError: stagesLoadFailed,
    error: stagesLoadError,
    refetch: refetchStages,
  } = useUnicoachStudentsByStage(Boolean(init.coach_data));
  const updateCallsMutation = useUpdateUnicoachStudentCallsMutation();
  const stages = useMemo(() => stagesData ?? {}, [stagesData]);
  const stagesErrorMessage =
    stagesLoadError instanceof Error ? stagesLoadError.message : stagesLoadFailed ? "Could not load student roster by stage." : null;

  const handleOpenJourney = (user: AssignedStudent) => {
    const params = new URLSearchParams();
    params.set("view", "student");
    params.set("user_id", String(user.id));
    router.replace(`/uniboard/unicoach?${params.toString()}`);
  };

  const handleSwitchBackToCoach = async () => {
    setIsSwitchingCoach(true);
    try {
      await clearCoachActAsSession();
      router.push("/uniboard/unicoach/coach");
      router.refresh();
    } catch {
      setIsSwitchingCoach(false);
    }
  };

  const rosterById = useMemo(() => {
    const map = new Map<number, AssignedStudent>();
    for (const u of coach?.assigned_users ?? []) map.set(u.id, u);
    for (const list of Object.values(stages)) {
      for (const u of list) map.set(u.id, { ...map.get(u.id), ...u });
    }
    return map;
  }, [coach?.assigned_users, stages]);

  const filteredStudents = useMemo((): CoachMountainStudent[] => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.from(rosterById.values());
    if (q) {
      list = list.filter(u => {
        const stage = stageOverrides[u.id] ?? stageKeyForUser(stages, u.id);
        const label = (COACH_PIPELINE_LABELS[stage] ?? stage).toLowerCase();
        const phone = (u.phone_number || "").toLowerCase();
        return (
          (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || phone.includes(q) || label.includes(q)
        );
      });
    }
    return list.map(u => ({
      ...u,
      pipelineStage: stageOverrides[u.id] ?? stageKeyForUser(stages, u.id),
    }));
  }, [rosterById, searchQuery, stages, stageOverrides]);

  const mountainDemoStudents = useMemo((): CoachMountainStudent[] => {
    return buildMountainDemoStudents().map(s => ({
      ...s,
      pipelineStage: demoStageOverrides[s.id] ?? s.pipelineStage,
    }));
  }, [demoStageOverrides]);

  const graphStudents = mountainDemoMode ? mountainDemoStudents : filteredStudents;

  const handlePipelineMove = useCallback(
    (userId: number, targetStage: CoachPipelineStage) => {
      setMoveError(null);
      if (isMountainDemoUserId(userId)) {
        setDemoStageOverrides(prev => ({ ...prev, [userId]: targetStage }));
        return;
      }
      setStageOverrides(prev => ({ ...prev, [userId]: targetStage }));
      updateCallsMutation.mutate(
        { userId, targetStage },
        {
          onSuccess: () => {
            setStageOverrides(prev => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
          },
          onError: (err: Error) => {
            setStageOverrides(prev => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
            setMoveError(err.message || "Could not update student stage. Try again.");
          },
        }
      );
    },
    [updateCallsMutation]
  );

  const totalCoachUnread = useMemo(() => {
    let total = 0;
    for (const u of rosterById.values()) {
      if (u.unread_counts) {
        total += Object.values(u.unread_counts).reduce((a, c) => a + c, 0);
      }
    }
    return total;
  }, [rosterById]);

  if (!coach) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] p-8">
        <p className="text-sm text-slate-500">Coach data unavailable.</p>
      </div>
    );
  }

  const coachFirstName = coach.coach_name.split(" ")[0] || coach.coach_name;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Coach</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight sm:text-xl">
                  {coachFirstName}&apos;s coach desk
                </h1>
                {totalCoachUnread > 0 ? (
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-2 text-[11px] font-semibold text-white">
                    {totalCoachUnread > 99 ? "99+" : totalCoachUnread} unread
                  </span>
                ) : null}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Your students and where each one is on the Unicoach journey.
              </p>
            </div>
            {init.is_being_impersonated ? (
              <button
                type="button"
                onClick={() => void handleSwitchBackToCoach()}
                disabled={isSwitchingCoach}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                {coach.coach_profile_picture ? (
                  <span className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={coach.coach_profile_picture} alt="" fill className="object-cover" sizes="32px" />
                  </span>
                ) : (
                  <span className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600">
                    {coach.coach_name.charAt(0)}
                  </span>
                )}
                {isSwitchingCoach ? "Switching…" : `Switch to ${coach.coach_name}`}
              </button>
            ) : null}
          </div>
        </section>

        {stagesErrorMessage ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            <p className="font-medium">Coach roster failed to load</p>
            <p className="mt-1 text-red-700 dark:text-red-300">{stagesErrorMessage}</p>
            <p className="mt-2 text-xs text-red-600/90 dark:text-red-400/90">
              The mountain graph uses init data only. Stage grouping comes from{" "}
              <code className="font-mono">/api/unicoach/students-by-stage/</code>.
            </p>
            <button
              type="button"
              onClick={() => void refetchStages()}
              className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
            >
              Retry roster load
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-center text-sm text-slate-500 py-8">Loading students…</p>
        ) : (
          <>
            <UnicoachCoachJourneyMountain
              students={graphStudents}
              onMove={handlePipelineMove}
              onOpenStudent={user => {
                if (isMountainDemoUserId(user.id)) return;
                handleOpenJourney(user);
              }}
              demoBanner={
                mountainDemoMode ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <strong>Demo mode</strong> — 10 test users on the graph (3 at Not started, 2 at Discovery, rest spread across stages).
                    Drag moves are local only. Remove <code className="font-mono">?mountain_demo=1</code> from the URL for real students.
                  </div>
                ) : null
              }
            />

            {moveError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {moveError}
              </p>
            ) : null}

            <section className="space-y-5">
              <h2 className="text-sm font-medium text-slate-900 dark:text-white">My students</h2>
              <UnicoachCoachStudentCards
                coach={coach}
                init={init}
                sessionEmail={sessionEmail}
                stages={stages}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onOpenJourney={handleOpenJourney}
                onPipelineChange={handlePipelineMove}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
};
