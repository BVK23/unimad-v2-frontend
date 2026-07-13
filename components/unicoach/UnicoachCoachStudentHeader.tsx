"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CoachPipelineStage } from "@/constants/unicoach-coach-pipeline";
import { COACH_SETTABLE_MILESTONES } from "@/constants/unicoach-journey-coach";
import { qk } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import { updateUnicoachStudentMeta } from "@/features/unicoach/server-actions/unicoach-actions";
import type { JourneyState, JourneyTargetProfile, UnicoachSubscriptionSummary } from "@/features/unicoach/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Star } from "lucide-react";

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
  { value: "vsl", label: "VSL" },
] as const;

const PILL_SELECT_CLASS =
  "w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:bg-slate-50 focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

const PLAIN_INPUT_CLASS =
  "block w-full border-0 bg-transparent p-0 text-xs text-slate-800 shadow-none outline-none ring-0 focus:ring-0 dark:text-slate-200";

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

function locationDisplayFromProfile(p: JourneyTargetProfile): string {
  if (p.location_display?.trim()) return p.location_display.trim();
  return [p.city, p.country].filter(Boolean).join(", ");
}

function desiredRoleDisplay(p: JourneyTargetProfile): string {
  const explicit = p.role?.trim();
  if (explicit) return explicit;
  const fromList = p.desired_roles?.map(r => (typeof r === "string" ? r.trim() : "")).find(Boolean);
  return fromList ?? "";
}

function formatPaidAmount(summary: UnicoachSubscriptionSummary): string {
  const symbol = summary.currency === "GBP" ? "£" : `${summary.currency} `;
  return `${symbol}${summary.total_paid_gbp.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function CoachSubscriptionPanel({
  summary,
  canRecordPayment,
  onRecordPayment,
}: {
  summary: UnicoachSubscriptionSummary | null | undefined;
  canRecordPayment?: boolean;
  onRecordPayment?: () => void;
}) {
  if (!summary && !canRecordPayment) return null;

  const showModules = Boolean(summary?.modules?.length);
  const showPurchases = Boolean(
    summary && (summary.purchases.length > 1 || (summary.access_level === "module" && summary.purchases.length > 0))
  );
  const needsMorePayment =
    canRecordPayment &&
    (!summary || summary.access_level === "vsl_discovery" || summary.access_level === "partial" || summary.access_level === "module");

  return (
    <aside className="w-full shrink-0 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40 lg:w-[13.5rem] lg:text-right">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Subscription</p>
      <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white">{summary?.program_label ?? "Discovery"}</p>
      {showModules ? (
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
          {summary!.modules.map(m => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
      {showPurchases ? (
        <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {summary!.purchases.map(p => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">Paid</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{summary ? formatPaidAmount(summary) : "£0"}</p>
      {needsMorePayment && onRecordPayment ? (
        <button
          type="button"
          onClick={onRecordPayment}
          className="mt-2 w-full rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-[11px] font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-950/70"
        >
          Record payment
        </button>
      ) : null}
    </aside>
  );
}

type SavePayload = {
  program_start_date?: string | null;
  closed_by?: string | null;
  conversion_mode?: string | null;
  linkedin_url?: string | null;
  location?: string | null;
};

function ClickToEditText({
  label,
  value,
  placeholder,
  display,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder: string;
  display?: React.ReactNode;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:w-24">{label}</dt>
      <dd className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft !== value) onCommit(draft);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                setDraft(value);
                setEditing(false);
              }
            }}
            placeholder={placeholder}
            className={`${PLAIN_INPUT_CLASS} rounded border border-slate-200 px-2 py-1 dark:border-slate-600`}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="text-left text-xs text-slate-800 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400"
          >
            {display ?? (value.trim() ? value : <span className="text-slate-400">Click to add</span>)}
          </button>
        )}
      </dd>
    </div>
  );
}

export type UnicoachCoachStudentHeaderProps = {
  profile: JourneyTargetProfile;
  journey: JourneyState;
  coachTargetUserId: string;
  completionPercent: number;
  completedCalls: number;
  callMilestonePercents: [number, number, number, number];
  coachSettableMilestone: CoachPipelineStage;
  onPipelineChange: (stage: string) => void;
  pipelinePending: boolean;
  onOpenProfile: () => void;
  openingProfile: boolean;
  onRecordPayment?: () => void;
};

export function UnicoachCoachStudentHeader({
  profile,
  journey,
  coachTargetUserId,
  completionPercent,
  completedCalls,
  callMilestonePercents,
  coachSettableMilestone,
  onPipelineChange,
  pipelinePending,
  onOpenProfile,
  openingProfile,
  onRecordPayment,
}: UnicoachCoachStudentHeaderProps) {
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<SavePayload>({});

  const metaSeed = {
    start: journey.student_meta?.program_start_date ?? "",
    closedBy: journey.student_meta?.closed_by ?? "",
    mode: journey.student_meta?.conversion_mode ?? "",
    linkedin: profile.linkedin_url ?? "",
    location: locationDisplayFromProfile(profile),
  };
  const [meta, setMeta] = useState(metaSeed);
  const metaSeedKey = `${coachTargetUserId}:${metaSeed.start}:${metaSeed.closedBy}:${metaSeed.mode}:${metaSeed.linkedin}:${metaSeed.location}`;
  const [metaSeedApplied, setMetaSeedApplied] = useState(metaSeedKey);
  if (metaSeedKey !== metaSeedApplied) {
    setMeta(metaSeed);
    setMetaSeedApplied(metaSeedKey);
  }

  const flushSave = useCallback(async () => {
    const payload = pendingPayloadRef.current;
    if (!Object.keys(payload).length) return;
    pendingPayloadRef.current = {};
    setSaveStatus("saving");
    try {
      await updateUnicoachStudentMeta({ userId: coachTargetUserId, ...payload });
      void queryClient.invalidateQueries({ queryKey: qk.journey(coachTargetUserId) });
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus(s => (s === "saved" ? "idle" : s)), 2500);
    } catch {
      setSaveStatus("error");
    }
  }, [coachTargetUserId, queryClient]);

  const scheduleSave = useCallback(
    (patch: SavePayload) => {
      pendingPayloadRef.current = { ...pendingPayloadRef.current, ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flushSave(), 8000);
    },
    [flushSave]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const commitField = useCallback(
    (patch: SavePayload, local: Partial<typeof meta>) => {
      setMeta(m => ({ ...m, ...local }));
      scheduleSave(patch);
    },
    [scheduleSave]
  );

  const desiredRole = desiredRoleDisplay(profile);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
            {profile.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_picture}
                alt=""
                className="h-full w-full object-cover"
                width={44}
                height={44}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
                {(profile.name || "?").charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-white sm:text-xl">{profile.name}</h1>
            <div className="mt-1.5 space-y-0.5 text-[11px] sm:text-xs">
              {profile.email ? (
                <span className="block truncate font-medium text-brand-600 dark:text-brand-400">{profile.email}</span>
              ) : null}
              {profile.phone_number ? (
                <span className="block truncate font-medium text-brand-600 dark:text-brand-400">{profile.phone_number}</span>
              ) : null}
              {desiredRole ? <p className="text-slate-600 dark:text-slate-300">{desiredRole}</p> : null}
            </div>
          </div>
        </div>

        {/* UIUX: stats + actions in one horizontal row, aligned to top-right */}
        <div className="flex w-full max-w-full shrink-0 items-stretch gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 self-stretch sm:w-auto sm:flex-none">
            <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Program Progress</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{completionPercent}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Calls Completed</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{completedCalls}/4</p>
            </div>
          </div>
          <div className="flex w-full min-w-0 shrink-0 flex-col justify-start gap-1.5 sm:w-auto sm:min-w-[10.75rem]">
            <button
              type="button"
              onClick={onOpenProfile}
              disabled={openingProfile || !coachTargetUserId}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-center text-xs font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              {openingProfile ? "Opening…" : "View Student Profile"}
            </button>
            <div className="relative w-full">
              <label htmlFor="coach-student-pipeline-status" className="sr-only">
                Pipeline status
              </label>
              <select
                id="coach-student-pipeline-status"
                value={coachSettableMilestone}
                onChange={e => onPipelineChange(e.target.value)}
                disabled={pipelinePending}
                className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-left text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:bg-slate-50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80"
              >
                {COACH_SETTABLE_MILESTONES.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <div className="relative flex h-10 w-full items-center">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300 dark:bg-brand-500"
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
                  call === 4
                    ? done
                      ? "Call 4 complete — progress to 100% when the student lands a role"
                      : "Call 4 milestone"
                    : done
                      ? `Call ${call} complete`
                      : `Call ${call} milestone`
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
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {[1, 2, 3, 4].map(call => {
            const done = call <= completedCalls;
            return (
              <div
                key={call}
                className={`rounded-full border px-2.5 py-1 ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                Call {call}
              </div>
            );
          })}
          <div
            className={`rounded-full border px-2.5 py-1 ${
              Boolean((journey.calls as { offered?: unknown } | undefined)?.offered)
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            Landed role
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {saveStatus === "saving" ? (
            <p className="mb-2 text-[10px] text-slate-500">Saving…</p>
          ) : saveStatus === "saved" ? (
            <p className="mb-2 text-[10px] text-emerald-600 dark:text-emerald-400">Changes saved</p>
          ) : saveStatus === "error" ? (
            <p className="mb-2 text-[10px] text-red-600">Could not save — try again</p>
          ) : null}
          <dl className="max-w-2xl space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:w-24">Start date</dt>
              <dd className="min-w-0">
                <input
                  type="date"
                  value={meta.start}
                  onChange={e => commitField({ program_start_date: e.target.value || null }, { start: e.target.value })}
                  className="rounded-lg border border-transparent bg-transparent py-0.5 text-xs text-slate-800 outline-none focus:border-slate-200 focus:bg-white focus:px-2 dark:text-slate-200 dark:focus:border-slate-600 dark:focus:bg-slate-900"
                />
              </dd>
            </div>
            <ClickToEditText
              label="LinkedIn"
              value={meta.linkedin}
              placeholder="https://linkedin.com/in/…"
              display={
                meta.linkedin ? (
                  <span className="text-brand-600 hover:underline dark:text-brand-400">{linkedInPathLabel(meta.linkedin)}</span>
                ) : undefined
              }
              onCommit={v => commitField({ linkedin_url: v || null }, { linkedin: v })}
            />
            <ClickToEditText
              label="Location"
              value={meta.location}
              placeholder="City, country"
              onCommit={v => commitField({ location: v || null }, { location: v })}
            />
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:w-24">Closed by</dt>
              <dd className="min-w-0">
                <div className="relative inline-block max-w-full">
                  <select
                    value={meta.closedBy}
                    onChange={e => commitField({ closed_by: e.target.value || null }, { closedBy: e.target.value })}
                    className={PILL_SELECT_CLASS}
                  >
                    {COACH_META_CLOSED_BY.map(o => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 opacity-80"
                    aria-hidden
                  />
                </div>
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:w-24">Mode</dt>
              <dd className="min-w-0">
                <div className="relative inline-block max-w-full">
                  <select
                    value={meta.mode}
                    onChange={e => commitField({ conversion_mode: e.target.value || null }, { mode: e.target.value })}
                    className={PILL_SELECT_CLASS}
                  >
                    {COACH_META_MODE.map(o => (
                      <option key={o.value || "none"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 opacity-80"
                    aria-hidden
                  />
                </div>
              </dd>
            </div>
          </dl>
        </div>
        <CoachSubscriptionPanel
          summary={journey.subscription_summary}
          canRecordPayment={Boolean(onRecordPayment)}
          onRecordPayment={onRecordPayment}
        />
      </div>
    </>
  );
}
