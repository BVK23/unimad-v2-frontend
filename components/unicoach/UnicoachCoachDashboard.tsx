"use client";

import React, { useMemo, useState } from "react";
import { fetchUserDataForPaymentPrefill, switchUnicoachUser } from "@/features/unicoach/server-actions/unicoach-actions";
import type { AssignedStudent, UnicoachInitResponse } from "@/features/unicoach/types";
import { parseCoachData } from "@/features/unicoach/types";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UnicoachCoachKanban } from "./UnicoachCoachKanban";
import { UnicoachCoachStudentCards } from "./UnicoachCoachStudentCards";

const VIEW_MODES = { cards: "cards", columns: "columns" } as const;
type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

export type UnicoachCoachDashboardProps = {
  init: UnicoachInitResponse;
};

export const UnicoachCoachDashboard: React.FC<UnicoachCoachDashboardProps> = ({ init }) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.cards);
  const [isSwitchingCoach, setIsSwitchingCoach] = useState(false);

  const coach = useMemo(() => parseCoachData(init), [init]);
  const { data: sessionPrefill } = useQuery({
    queryKey: ["unicoach", "session-user-prefill"],
    queryFn: () => fetchUserDataForPaymentPrefill(),
    staleTime: 120_000,
  });
  const sessionEmail = sessionPrefill?.email ?? null;

  const handleOpenJourney = (user: AssignedStudent) => {
    const params = new URLSearchParams();
    params.set("view", "student");
    params.set("user_id", String(user.id));
    router.replace(`/uniboard/unicoach?${params.toString()}`);
  };

  const handleSwitchBackToCoach = async () => {
    if (!coach) return;
    setIsSwitchingCoach(true);
    try {
      await switchUnicoachUser(coach.coach_email);
      window.location.reload();
    } catch {
      setIsSwitchingCoach(false);
    }
  };

  if (!coach) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] p-8">
        <p className="text-sm text-slate-500">Coach data unavailable.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
      <div className={`max-w-7xl mx-auto p-6 lg:p-8 space-y-6 ${viewMode === VIEW_MODES.columns ? "flex flex-col min-h-0" : ""}`}>
        <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Coach</p>
              <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium mt-1">Unicoach Coach</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
                Browse students as cards or on the stage board; open their journey when you tap a profile.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setViewMode(VIEW_MODES.cards)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    viewMode === VIEW_MODES.cards
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(VIEW_MODES.columns)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    viewMode === VIEW_MODES.columns
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800"
                  }`}
                >
                  Columns
                </button>
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
          </div>
        </section>

        {viewMode === VIEW_MODES.cards ? (
          <UnicoachCoachStudentCards coach={coach} init={init} sessionEmail={sessionEmail} onOpenJourney={handleOpenJourney} />
        ) : (
          <div className="flex-1 flex flex-col min-h-[50vh]">
            <UnicoachCoachKanban init={init} sessionEmail={sessionEmail} onOpenJourney={handleOpenJourney} />
          </div>
        )}
      </div>
    </div>
  );
};
