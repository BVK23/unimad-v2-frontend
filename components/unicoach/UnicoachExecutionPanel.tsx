"use client";

import { useCallback, useMemo, useState } from "react";
import { UnicoachExecutionCalendar, executionDateKey } from "@/components/unicoach/UnicoachExecutionCalendar";
import {
  ALL_EXECUTION_ITEMS,
  executionItemsForStage,
  type ExecutionDailyItemDef,
  type ExecutionStageId,
} from "@/constants/unicoach-execution-daily";
import { useExecutionDailyLog } from "@/features/unicoach/hooks/use-execution-daily-log";
import type { DailyExecutionItemKey } from "@/features/unicoach/types";
import { applicableExecutionItems, clampExecutionCount, getCount } from "@/features/unicoach/utils/execution-daily-log";
import { ArrowRight, CalendarDays, Minus, Plus } from "lucide-react";
import Link from "next/link";

type ExecutionView = "day" | "week" | "month";

type Props = {
  executionStageId: ExecutionStageId;
  journeyUserId?: string | null;
  readOnly?: boolean;
};

export function UnicoachExecutionPanel({ executionStageId, journeyUserId, readOnly = false }: Props) {
  const [view, setView] = useState<ExecutionView>("day");
  const [selectedDate, setSelectedDate] = useState(() => executionDateKey(new Date()));

  const { getEntry, setCount } = useExecutionDailyLog(journeyUserId, readOnly);

  const dayItems = useMemo(() => executionItemsForStage(executionStageId), [executionStageId]);
  const calendarItems = ALL_EXECUTION_ITEMS;
  const todayKey = useMemo(() => executionDateKey(new Date()), []);

  const activeDateKey = selectedDate;
  const entryForEdit = getEntry(activeDateKey);

  const totals = useMemo(() => {
    const applicable = applicableExecutionItems(dayItems, activeDateKey, entryForEdit);
    let done = 0;
    let target = 0;
    let habitsComplete = 0;
    for (const item of applicable) {
      const count = getCount(entryForEdit, item.key);
      target += item.dailyTarget;
      done += Math.min(count, item.dailyTarget);
      if (count >= item.dailyTarget) habitsComplete += 1;
    }
    return { done, target, habitsComplete, total: applicable.length, ratio: target ? done / target : 0 };
  }, [entryForEdit, dayItems, activeDateKey]);

  const remaining = totals.total - totals.habitsComplete;

  const handleCountInput = (key: DailyExecutionItemKey, raw: string, dailyTarget: number) => {
    const parsed = raw === "" ? 0 : clampExecutionCount(parseInt(raw, 10) || 0, dailyTarget);
    setCount(activeDateKey, key, parsed);
  };

  const stepCount = (key: DailyExecutionItemKey, delta: number, dailyTarget: number) => {
    const current = getCount(entryForEdit, key);
    setCount(activeDateKey, key, clampExecutionCount(current + delta, dailyTarget));
  };

  const dateLabel = useMemo(() => {
    const d = new Date(`${activeDateKey}T12:00:00`);
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }, [activeDateKey]);

  const isToday = activeDateKey === todayKey;
  const dayPct = totals.target > 0 ? Math.round(totals.ratio * 100) : 0;

  const handleDateSelectFromCalendar = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
    setView("day");
  }, []);

  return (
    <div className="space-y-4">
      <ExecutionViewHeader
        view={view}
        isToday={isToday}
        dateLabel={dateLabel}
        onViewChange={next => {
          setView(next);
          if (next === "day" && !selectedDate) setSelectedDate(todayKey);
        }}
      />

      {view === "day" ? (
        <>
          {remaining > 0 && !readOnly ? (
            <div className="rounded-lg border border-brand-200 bg-brand-50/80 px-3 py-2 text-xs text-brand-900 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-100">
              {remaining === totals.total
                ? "Start your rhythm — log at least one item when you're done."
                : `${remaining} habit${remaining === 1 ? "" : "s"} left on today's plan.`}
            </div>
          ) : null}

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{isToday ? "Today's progress" : "Day progress"}</span>
              <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {totals.done}/{totals.target}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-brand-600 transition-all dark:bg-brand-500"
                style={{ width: `${Math.min(100, dayPct)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {totals.habitsComplete}/{totals.total} habits at target
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dayItems.map(item => (
              <ExecutionCard
                key={item.key}
                item={item}
                count={getCount(entryForEdit, item.key)}
                readOnly={readOnly}
                onCountChange={v => handleCountInput(item.key, v, item.dailyTarget)}
                onStep={delta => stepCount(item.key, delta, item.dailyTarget)}
              />
            ))}
          </div>
        </>
      ) : (
        <UnicoachExecutionCalendar
          items={calendarItems}
          journeyUserId={journeyUserId}
          readOnly={readOnly}
          mode={view}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelectFromCalendar}
        />
      )}
    </div>
  );
}

function ExecutionViewHeader({
  view,
  isToday,
  dateLabel,
  onViewChange,
}: {
  view: ExecutionView;
  isToday: boolean;
  dateLabel: string;
  onViewChange: (v: ExecutionView) => void;
}) {
  const views: { id: ExecutionView; label: string }[] = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
          {view === "day" ? (isToday ? "Today" : "Day view") : view === "week" ? "Week view" : "Month view"}
        </p>
        <p className="mt-0.5 text-base font-medium text-slate-900 dark:text-white">{dateLabel}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {view === "day"
            ? "Changes save automatically."
            : view === "week"
              ? "Drag habits onto each day. All five habits available here."
              : "Tap a date to open day view. Circle = habits at target."}
        </p>
      </div>
      <div
        className="inline-flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900"
        role="group"
        aria-label="Activity calendar view"
      >
        <div
          className="flex items-center justify-center border-r border-slate-200 bg-slate-50 px-2.5 dark:border-slate-600 dark:bg-slate-800/80"
          title="Activity calendar"
        >
          <CalendarDays size={16} className="text-brand-600 dark:text-brand-400" aria-hidden />
        </div>
        <div className="flex bg-slate-100 p-0.5 dark:bg-slate-800/80">
          {views.map(opt => {
            const active = view === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onViewChange(opt.id)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-200"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExecutionCard({
  item,
  count,
  readOnly,
  onCountChange,
  onStep,
}: {
  item: ExecutionDailyItemDef;
  count: number;
  readOnly: boolean;
  onCountChange: (value: string) => void;
  onStep: (delta: number) => void;
}) {
  const complete = count >= item.dailyTarget;
  const subtitle = item.hint ?? `Goal: ${item.dailyTarget} per day`;

  return (
    <article
      className={`flex flex-col justify-between gap-3 rounded-xl border px-3 py-3 ${
        complete
          ? "border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">{item.label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
        {item.href ? (
          <Link
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Open tool
            <ArrowRight size={12} strokeWidth={2.25} />
          </Link>
        ) : null}
      </div>
      <div className="flex justify-end">
        <CountStepper count={count} target={item.dailyTarget} readOnly={readOnly} onChange={onCountChange} onStep={onStep} />
      </div>
    </article>
  );
}

function CountStepper({
  count,
  target,
  readOnly,
  onChange,
  onStep,
}: {
  count: number;
  target: number;
  readOnly: boolean;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
}) {
  const circleBtn =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={readOnly || count <= 0}
          onClick={() => onStep(-1)}
          className={circleBtn}
          aria-label="Decrease count"
        >
          <Minus size={14} strokeWidth={2} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={count === 0 ? "" : String(count)}
          readOnly={readOnly}
          onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className="w-8 border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none focus:ring-0 dark:text-white"
          aria-label="Count done today"
        />
        <button
          type="button"
          disabled={readOnly || count >= target}
          onClick={() => onStep(1)}
          className={circleBtn}
          aria-label="Increase count"
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </div>
      <span className="pr-1 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">of {target}</span>
    </div>
  );
}
