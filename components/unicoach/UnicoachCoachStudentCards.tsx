"use client";

import React, { useCallback, useMemo, useState } from "react";
import { UNICOACH_COACH_STAGE_LABELS, UNICOACH_COACH_STAGE_ORDER, type UnicoachCoachStageKey } from "@/constants/unicoach-coach-stages";
import { useUnicoachStudentsByStage } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import type { AssignedStudent, CoachData, UnicoachInitResponse, UnicoachStudentsByStage } from "@/features/unicoach/types";
import { ArrowDownUp, Filter, Search } from "lucide-react";
import Image from "next/image";

export type UnicoachCoachStudentCardsProps = {
  coach: CoachData;
  init: UnicoachInitResponse;
  sessionEmail: string | null | undefined;
  onOpenJourney: (user: AssignedStudent) => void;
};

type CoachRosterSort = "actions" | "name" | "progress";
type CoachRosterStageFilter = "all" | UnicoachCoachStageKey;

function getStageIndex(stageKey: UnicoachCoachStageKey): number {
  const i = UNICOACH_COACH_STAGE_ORDER.indexOf(stageKey);
  return i >= 0 ? i : 0;
}

function stageKeyForUser(stages: UnicoachStudentsByStage, userId: number): UnicoachCoachStageKey {
  for (const key of UNICOACH_COACH_STAGE_ORDER) {
    if ((stages[key] || []).some(u => u.id === userId)) return key;
  }
  return "not_started";
}

function programProgressRingStroke(percent: number): string {
  const p = Math.min(100, Math.max(0, percent));
  if (p < 10) return "#dc2626";
  if (p < 50) return "#ca8a04";
  if (p < 90) return "#16a34a";
  return "#2563eb";
}

function stageToProgressPercent(stageKey: UnicoachCoachStageKey): number {
  const n = UNICOACH_COACH_STAGE_ORDER.length - 1;
  if (n <= 0) return 100;
  return Math.round((getStageIndex(stageKey) / n) * 100);
}

function coachStageBadgeClasses(stage: UnicoachCoachStageKey): string {
  const base = "shrink-0 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  switch (stage) {
    case "not_started":
      return `${base} bg-red-100 text-red-900 dark:bg-red-950/55 dark:text-red-200`;
    case "call_1":
    case "portfolio":
    case "call_2":
    case "call_3":
      return `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  }
}

function CoachAvatarWithProgressRing({
  pic,
  name,
  percent,
  unreadTotal,
}: {
  pic: string | null;
  name: string;
  percent: number;
  unreadTotal: number;
}) {
  const outer = 60;
  const stroke = 3.25;
  const img = 48;
  const cx = outer / 2;
  const cy = outer / 2;
  const r = Math.max(0, outer / 2 - stroke / 2 - 0.5);
  const circ = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const offset = circ * (1 - p / 100);
  const strokeColor = programProgressRingStroke(p);
  const pad = (outer - img) / 2;

  return (
    <div className="relative shrink-0" style={{ width: outer, height: outer }} role="img" aria-label={`Program progress ${Math.round(p)}%`}>
      <svg width={outer} height={outer} className="pointer-events-none absolute left-0 top-0" aria-hidden>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="text-slate-200 dark:text-slate-700"
            stroke="currentColor"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </g>
      </svg>
      <div
        className="absolute overflow-hidden rounded-full border border-slate-200 bg-slate-100 object-cover dark:border-slate-600 dark:bg-slate-800"
        style={{ width: img, height: img, left: pad, top: pad }}
      >
        {pic ? (
          <Image src={pic} alt="" width={img} height={img} className="h-full w-full object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">{(name || "?").charAt(0)}</div>
        )}
      </div>
      {unreadTotal > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-[#111]">
          {unreadTotal > 99 ? "99+" : unreadTotal}
        </span>
      ) : null}
    </div>
  );
}

export const UnicoachCoachStudentCards: React.FC<UnicoachCoachStudentCardsProps> = ({ coach, init, sessionEmail, onOpenJourney }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<CoachRosterStageFilter>("all");
  const [rosterSort, setRosterSort] = useState<CoachRosterSort>("actions");

  const { data: stagesData, isLoading: stagesLoading } = useUnicoachStudentsByStage(Boolean(init.coach_data));

  const stages = useMemo(() => stagesData ?? ({} as UnicoachStudentsByStage), [stagesData]);

  const unreadTotalFor = useCallback((u: AssignedStudent) => {
    if (!u.unread_counts) return 0;
    return Object.values(u.unread_counts).reduce((a, c) => a + c, 0);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = coach.assigned_users || [];
    if (q) {
      list = list.filter(u => {
        const stageKey = stageKeyForUser(stages, u.id);
        const stageLabel = UNICOACH_COACH_STAGE_LABELS[stageKey].toLowerCase();
        return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || stageLabel.includes(q);
      });
    }
    if (stageFilter !== "all") {
      list = list.filter(u => stageKeyForUser(stages, u.id) === stageFilter);
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      const ua = unreadTotalFor(a);
      const ub = unreadTotalFor(b);
      const sa = getStageIndex(stageKeyForUser(stages, a.id));
      const sb = getStageIndex(stageKeyForUser(stages, b.id));
      if (rosterSort === "actions") {
        if (ub !== ua) return ub - ua;
        if (sb !== sa) return sb - sa;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (rosterSort === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sb !== sa) return sb - sa;
      return (a.name || "").localeCompare(b.name || "");
    });
    return sorted;
  }, [coach.assigned_users, searchQuery, stageFilter, rosterSort, stages, unreadTotalFor]);

  const isImpersonating = Boolean(init.is_being_impersonated);

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full min-w-0 lg:max-w-md lg:flex-1">
          <label htmlFor="coach-roster-search" className="sr-only">
            Search students
          </label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="coach-roster-search"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, stage…"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 dark:placeholder:text-slate-500"
            aria-label="Search students"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <label htmlFor="coach-roster-stage-filter" className="sr-only">
              Filter by stage
            </label>
            <select
              id="coach-roster-stage-filter"
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value as CoachRosterStageFilter)}
              className="min-w-[10.5rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 sm:flex-initial sm:min-w-[12rem]"
            >
              <option value="all">All stages</option>
              {UNICOACH_COACH_STAGE_ORDER.map(s => (
                <option key={s} value={s}>
                  {UNICOACH_COACH_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <label htmlFor="coach-roster-sort" className="sr-only">
              Sort students
            </label>
            <select
              id="coach-roster-sort"
              value={rosterSort}
              onChange={e => setRosterSort(e.target.value as CoachRosterSort)}
              className="min-w-[11rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 sm:flex-initial"
            >
              <option value="actions">Unread, then progress</option>
              <option value="name">Name (A–Z)</option>
              <option value="progress">Progress (furthest)</option>
            </select>
          </div>
        </div>
      </div>

      {stagesLoading ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Loading roster…
        </p>
      ) : filteredUsers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {searchQuery.trim()
            ? "No students match your search."
            : stageFilter !== "all"
              ? "No students match this stage."
              : "No assigned students yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map(user => {
            const isCurrentUser = sessionEmail === user.email;
            const disableDropdown = isImpersonating && isCurrentUser;
            const pic = user.unimad_profile_picture || user.linkedin_profile_picture || null;
            const unreadTotal = unreadTotalFor(user);
            const stageKey = stageKeyForUser(stages, user.id);
            const progressPct = stageToProgressPercent(stageKey);
            return (
              <div
                key={user.email}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (disableDropdown) return;
                  onOpenJourney(user);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!disableDropdown) onOpenJourney(user);
                  }
                }}
                className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-[#111] dark:hover:border-brand-500/40 ${
                  isCurrentUser ? "ring-2 ring-brand-500" : ""
                } ${disableDropdown ? "cursor-not-allowed opacity-80" : ""}`}
              >
                <div className="flex gap-3">
                  <CoachAvatarWithProgressRing pic={pic} name={user.name} percent={progressPct} unreadTotal={unreadTotal} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <span
                            className={`${coachStageBadgeClasses(stageKey)} max-w-[10rem] shrink-0 truncate`}
                            title={UNICOACH_COACH_STAGE_LABELS[stageKey]}
                          >
                            {UNICOACH_COACH_STAGE_LABELS[stageKey]}
                          </span>
                        </div>
                        <a
                          href={`mailto:${user.email}`}
                          onClick={e => e.stopPropagation()}
                          className="block truncate text-xs text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {user.email}
                        </a>
                        <dl className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex gap-1.5">
                            <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Progress</dt>
                            <dd className="min-w-0">{progressPct}%</dd>
                          </div>
                          {unreadTotal > 0 ? (
                            <div className="flex gap-1.5">
                              <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Unread</dt>
                              <dd className="min-w-0 font-medium text-amber-700 dark:text-amber-300">{unreadTotal} message(s)</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                      <button
                        type="button"
                        disabled={disableDropdown}
                        className={`shrink-0 rounded-xl border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-900 dark:text-brand-300 dark:hover:bg-brand-950/50 ${
                          disableDropdown ? "cursor-not-allowed opacity-40" : ""
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          if (disableDropdown) return;
                          onOpenJourney(user);
                        }}
                      >
                        Open profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Click a card or &quot;Open profile&quot; to view the student journey.
      </p>
    </div>
  );
};
