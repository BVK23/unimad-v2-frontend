"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  COACH_PIPELINE_DROPDOWN_ORDER,
  COACH_PIPELINE_LABELS,
  pipelineStageBadgeClasses,
  type CoachPipelineStage,
} from "@/constants/unicoach-coach-pipeline";
import type { AssignedStudent, CoachData, UnicoachInitResponse, UnicoachStudentsByStage } from "@/features/unicoach/types";
import { resolveProfilePicture } from "@/features/unicoach/utils/profile-picture";
import { ArrowDownUp, Filter, Search } from "lucide-react";

export type UnicoachCoachStudentCardsProps = {
  coach: CoachData;
  init: UnicoachInitResponse;
  sessionEmail: string | null | undefined;
  stages: UnicoachStudentsByStage;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onOpenJourney: (user: AssignedStudent) => void;
  onPipelineChange: (userId: number, targetStage: CoachPipelineStage) => void;
};

type CoachRosterSort = "progress" | "name" | "joined";
type CoachRosterStageFilter = "all" | CoachPipelineStage;

function stageKeyForUser(stages: UnicoachStudentsByStage, userId: number): CoachPipelineStage {
  for (const key of COACH_PIPELINE_DROPDOWN_ORDER) {
    if ((stages[key] || []).some(u => u.id === userId)) return key;
  }
  return "not_started";
}

function stageToProgressPercent(stageKey: CoachPipelineStage): number {
  const idx = COACH_PIPELINE_DROPDOWN_ORDER.indexOf(stageKey);
  const n = COACH_PIPELINE_DROPDOWN_ORDER.length - 1;
  if (n <= 0 || idx < 0) return 0;
  return Math.round((idx / n) * 100);
}

function linkedInPathLabel(url: string | null | undefined): string {
  if (!url?.trim()) return "—";
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, "");
    return path.length > 36 ? `${path.slice(0, 34)}…` : path || "Profile";
  } catch {
    return "LinkedIn";
  }
}

function formatRosterStartDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function programProgressRingStroke(percent: number): string {
  const p = Math.min(100, Math.max(0, percent));
  if (p < 10) return "#dc2626";
  if (p < 50) return "#ca8a04";
  if (p < 90) return "#16a34a";
  return "#2563eb";
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
    <div className="relative shrink-0" style={{ width: outer, height: outer }}>
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
        className="absolute overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
        style={{ width: img, height: img, left: pad, top: pad }}
      >
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pic} alt="" width={img} height={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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

function PipelineStatusPill({
  userId,
  pipeline,
  openId,
  onToggle,
  onSelect,
}: {
  userId: number;
  pipeline: CoachPipelineStage;
  openId: number | null;
  onToggle: (id: number | null) => void;
  onSelect: (stage: CoachPipelineStage) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = openId === userId;

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onToggle(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isOpen, onToggle]);

  return (
    <div ref={menuRef} className="relative shrink-0" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={e => {
          e.stopPropagation();
          onToggle(isOpen ? null : userId);
        }}
        className={`${pipelineStageBadgeClasses(pipeline)} cursor-pointer border border-transparent hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
        title="Change pipeline status"
      >
        {COACH_PIPELINE_LABELS[pipeline]}
      </button>
      {isOpen ? (
        <ul
          role="listbox"
          aria-label="Pipeline status"
          className="absolute right-0 z-40 mt-1 max-h-56 min-w-[11rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          {COACH_PIPELINE_DROPDOWN_ORDER.map(s => (
            <li key={s} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={s === pipeline}
                className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 ${
                  s === pipeline ? "bg-slate-50 dark:bg-slate-800/80" : ""
                }`}
                onClick={e => {
                  e.stopPropagation();
                  onSelect(s);
                  onToggle(null);
                }}
              >
                {COACH_PIPELINE_LABELS[s]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const UnicoachCoachStudentCards: React.FC<UnicoachCoachStudentCardsProps> = ({
  coach,
  init,
  sessionEmail,
  stages,
  searchQuery,
  onSearchQueryChange,
  onOpenJourney,
  onPipelineChange,
}) => {
  const [stageFilter, setStageFilter] = React.useState<CoachRosterStageFilter>("all");
  const [rosterSort, setRosterSort] = React.useState<CoachRosterSort>("progress");
  const [openPipelineId, setOpenPipelineId] = React.useState<number | null>(null);

  const rosterById = useMemo(() => {
    const map = new Map<number, AssignedStudent>();
    for (const u of coach.assigned_users || []) map.set(u.id, u);
    for (const list of Object.values(stages)) {
      for (const u of list) map.set(u.id, { ...map.get(u.id), ...u });
    }
    return map;
  }, [coach.assigned_users, stages]);

  const unreadTotalFor = useCallback((u: AssignedStudent) => {
    if (!u.unread_counts) return 0;
    return Object.values(u.unread_counts).reduce((a, c) => a + c, 0);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.from(rosterById.values());
    if (q) {
      list = list.filter(u => {
        const stageKey = stageKeyForUser(stages, u.id);
        const stageLabel = COACH_PIPELINE_LABELS[stageKey].toLowerCase();
        const phone = (u.phone_number || "").toLowerCase();
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          phone.includes(q) ||
          stageLabel.includes(q)
        );
      });
    }
    if (stageFilter !== "all") {
      list = list.filter(u => stageKeyForUser(stages, u.id) === stageFilter);
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      const sa = stageToProgressPercent(stageKeyForUser(stages, a.id));
      const sb = stageToProgressPercent(stageKeyForUser(stages, b.id));
      if (rosterSort === "name") return (a.name || "").localeCompare(b.name || "");
      if (rosterSort === "joined") {
        const da = a.program_start_date || "";
        const db = b.program_start_date || "";
        if (da !== db) return db.localeCompare(da);
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sb !== sa) return sb - sa;
      return (a.name || "").localeCompare(b.name || "");
    });
    return sorted;
  }, [rosterById, searchQuery, stageFilter, rosterSort, stages]);

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
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder="Search by name, email, phone, status…"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value as CoachRosterStageFilter)}
              className="min-w-[10.5rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:flex-initial"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {COACH_PIPELINE_DROPDOWN_ORDER.map(s => (
                <option key={s} value={s}>
                  {COACH_PIPELINE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <select
              value={rosterSort}
              onChange={e => setRosterSort(e.target.value as CoachRosterSort)}
              className="min-w-[11rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:flex-initial"
              aria-label="Sort students"
            >
              <option value="name">Name (A–Z)</option>
              <option value="joined">Date joined (newest)</option>
              <option value="progress">Progress (highest)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {searchQuery.trim()
            ? "No students match your search."
            : stageFilter !== "all"
              ? "No students match this status."
              : "No students on your roster."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map(user => {
            const isCurrentUser = sessionEmail === user.email;
            const disableOpen = isImpersonating && isCurrentUser;
            const pic = resolveProfilePicture({
              direct: user.profile_picture,
              unimad: user.unimad_profile_picture,
              linkedin: user.linkedin_profile_picture,
              google: user.google_profile_picture,
            });
            const unreadTotal = unreadTotalFor(user);
            const pipelineStage = stageKeyForUser(stages, user.id);
            const progressPct = stageToProgressPercent(pipelineStage);
            const programLabel = user.program_chosen || user.program_label || "Unicoach Program";

            return (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => !disableOpen && onOpenJourney(user)}
                onKeyDown={e => {
                  if ((e.key === "Enter" || e.key === " ") && !disableOpen) {
                    e.preventDefault();
                    onOpenJourney(user);
                  }
                }}
                className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40 ${
                  isCurrentUser ? "ring-2 ring-brand-500/25 border-brand-500/40" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <CoachAvatarWithProgressRing pic={pic} name={user.name} percent={progressPct} unreadTotal={unreadTotal} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400" title={programLabel}>
                          {programLabel}
                        </p>
                      </div>
                      <PipelineStatusPill
                        userId={user.id}
                        pipeline={pipelineStage}
                        openId={openPipelineId}
                        onToggle={setOpenPipelineId}
                        onSelect={stage => onPipelineChange(user.id, stage)}
                      />
                    </div>
                    <span className="block truncate text-xs text-brand-600 dark:text-brand-400">{user.email}</span>
                    <dl className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex gap-1.5">
                        <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Start</dt>
                        <dd className="min-w-0">{formatRosterStartDate(user.program_start_date)}</dd>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Phone</dt>
                        <dd className="min-w-0">
                          {user.phone_number?.trim() ? (
                            <span className="break-all text-brand-600 dark:text-brand-400">{user.phone_number}</span>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <dt className="w-14 shrink-0 pt-0.5 text-slate-400 dark:text-slate-500">LinkedIn</dt>
                        <dd className="min-w-0">
                          {user.linkedin_url?.trim() ? (
                            <span className="break-all text-brand-600 dark:text-brand-400">{linkedInPathLabel(user.linkedin_url)}</span>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">Select a student to open their program status.</p>
    </div>
  );
};
