"use client";

import { useCallback, useMemo, useState } from "react";
import { executionItemsForStage, type ExecutionDailyItemDef } from "@/constants/unicoach-execution-daily";
import { postExecutionDaily } from "@/features/unicoach/server-actions/unicoach-actions";
import type { DailyExecutionDayEntry, DailyExecutionItemKey, ExecutionTracker } from "@/features/unicoach/types";
import { countTasksWithProgress, getCount, normalizeDayEntry } from "@/features/unicoach/utils/execution-daily-log";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

function scoreColor(ratio: number): string {
  if (ratio >= 1) return "bg-emerald-500 text-white";
  if (ratio >= 0.6) return "bg-lime-400 text-slate-900";
  if (ratio >= 0.35) return "bg-amber-400 text-slate-900";
  return "bg-red-300 text-slate-900";
}

function ProgressDot({ done, total, ratio }: { done: number; total: number; ratio: number }) {
  if (done === 0) return null;
  return (
    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold ${scoreColor(ratio)}`}>
      {done}/{total}
    </span>
  );
}

function CounterControls({
  count,
  target,
  readOnly,
  pending,
  onChange,
}: {
  count: number;
  target: number;
  readOnly: boolean;
  pending: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={readOnly || pending || count <= 0}
        onClick={() => onChange(Math.max(0, count - 1))}
        className="rounded-md border border-slate-200 p-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
        aria-label="Decrease"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[2.75rem] text-center text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        {count}/{target}
      </span>
      <button
        type="button"
        disabled={readOnly || pending || count >= target}
        onClick={() => onChange(Math.min(target, count + 1))}
        className="rounded-md border border-slate-200 p-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
        aria-label="Increase"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

type ViewMode = "month" | "week" | "day";

type Props = {
  tracker?: ExecutionTracker | null;
  includeStage6Items?: boolean;
  journeyUserId?: string | null;
  readOnly?: boolean;
  selectedDate?: string;
  onSelectedDateChange?: (dateKey: string) => void;
};

export const UnicoachExecutionCalendar = ({
  tracker,
  includeStage6Items = false,
  journeyUserId,
  readOnly = false,
  selectedDate: selectedDateProp,
  onSelectedDateChange,
}: Props) => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDateInternal, setSelectedDateInternal] = useState(() => toDateKey(new Date()));
  const [dragTask, setDragTask] = useState<DailyExecutionItemKey | null>(null);

  const selectedDate = selectedDateProp ?? selectedDateInternal;
  const setSelectedDate = (key: string) => {
    if (onSelectedDateChange) onSelectedDateChange(key);
    else setSelectedDateInternal(key);
  };

  const items = useMemo(() => executionItemsForStage(includeStage6Items), [includeStage6Items]);
  const itemKeys = useMemo(() => items.map(i => i.key), [items]);
  const itemByKey = useMemo(() => new Map(items.map(i => [i.key, i])), [items]);

  const dailyLog = tracker?.daily_log ?? {};

  const getEntry = useCallback((dateKey: string) => normalizeDayEntry(dailyLog[dateKey]), [dailyLog]);

  const mutation = useMutation({
    mutationFn: (payload: { date: string; entry: DailyExecutionDayEntry }) =>
      postExecutionDaily({
        date: payload.date,
        entry: payload.entry,
        user_id: journeyUserId ?? undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
    },
  });

  const persistEntry = (dateKey: string, entry: DailyExecutionDayEntry) => {
    if (readOnly || mutation.isPending) return;
    mutation.mutate({ date: dateKey, entry });
  };

  const setCount = (dateKey: string, taskKey: DailyExecutionItemKey, count: number) => {
    const entry = getEntry(dateKey);
    const tasks = entry.tasks ?? [];
    const nextTasks = tasks.includes(taskKey) ? tasks : [...tasks, taskKey];
    persistEntry(dateKey, {
      tasks: nextTasks,
      counts: { ...entry.counts, [taskKey]: count },
    });
  };

  const addTaskToDay = (dateKey: string, taskKey: DailyExecutionItemKey) => {
    const entry = getEntry(dateKey);
    if (entry.tasks?.includes(taskKey)) return;
    persistEntry(dateKey, {
      tasks: [...(entry.tasks ?? []), taskKey],
      counts: { ...entry.counts, [taskKey]: entry.counts?.[taskKey] ?? 0 },
    });
  };

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const anchor = view === "day" ? parseDateKey(selectedDate) : cursor;
    const day = anchor.getDay();
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return x;
    });
  }, [cursor, view, selectedDate]);

  const dayScore = useCallback(
    (dateKey: string) => {
      const entry = getEntry(dateKey);
      const { done, total } = countTasksWithProgress(entry, itemKeys);
      return { done, total, ratio: total ? done / total : 0 };
    },
    [getEntry, itemKeys]
  );

  const navLabel = useMemo(() => {
    if (view === "day") {
      return parseDateKey(selectedDate).toLocaleDateString(undefined, {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (view === "week") {
      const a = weekDays[0];
      const b = weekDays[6];
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `${fmt(a)} – ${fmt(b)}`;
    }
    return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [view, cursor, selectedDate, weekDays]);

  const stepNav = (delta: number) => {
    if (view === "month") {
      const n = new Date(cursor);
      n.setMonth(n.getMonth() + delta);
      setCursor(n);
      return;
    }
    if (view === "week") {
      const n = new Date(cursor);
      n.setDate(n.getDate() + delta * 7);
      setCursor(n);
      return;
    }
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + delta);
    const key = toDateKey(d);
    setSelectedDate(key);
    setCursor(d);
  };

  const renderTaskRow = (dateKey: string, def: ExecutionDailyItemDef, compact?: boolean) => {
    const entry = getEntry(dateKey);
    const count = getCount(entry, def.key);
    return (
      <div
        key={def.key}
        className={`rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900/40 ${compact ? "text-[11px]" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 font-medium text-slate-800 dark:text-slate-200">{compact ? def.shortLabel : def.label}</span>
          <CounterControls
            count={count}
            target={def.dailyTarget}
            readOnly={readOnly}
            pending={mutation.isPending}
            onChange={n => setCount(dateKey, def.key, n)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 dark:text-white">Daily execution calendar</p>
        <div className="flex overflow-hidden rounded-lg border border-slate-200 text-[10px] dark:border-slate-700">
          {(["month", "week", "day"] as ViewMode[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                if (v === "day") setCursor(parseDateKey(selectedDate));
              }}
              className={`px-2 py-1 capitalize ${view === v ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-400"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => stepNav(-1)}
          className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{navLabel}</span>
        <button
          type="button"
          aria-label="Next"
          onClick={() => stepNav(1)}
          className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {view === "month" ? (
        <div className="overflow-x-auto">
          <div className="mb-1 grid min-w-[280px] grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid min-w-[280px] grid-cols-7 gap-1">
            {monthDays.map((d, i) => {
              if (!d) return <div key={`pad-${i}`} className="aspect-square" />;
              const key = toDateKey(d);
              const { done, total, ratio } = dayScore(key);
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(key);
                    setCursor(d);
                    setView("day");
                  }}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] transition-colors ${
                    isSelected
                      ? "border-brand-500 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-400">{d.getDate()}</span>
                  <ProgressDot done={done} total={total} ratio={ratio} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 min-h-[220px]">
            {weekDays.map(d => {
              const dateKey = toDateKey(d);
              const entry = getEntry(dateKey);
              const activeTasks = entry.tasks ?? [];
              const { done, total, ratio } = dayScore(dateKey);
              return (
                <div
                  key={dateKey}
                  className={`flex w-[148px] flex-shrink-0 flex-col rounded-xl border bg-slate-50/80 dark:bg-slate-900/30 ${
                    dateKey === selectedDate ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200 dark:border-slate-700"
                  }`}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const key = (e.dataTransfer.getData("text/task-key") || dragTask) as DailyExecutionItemKey;
                    if (key && itemByKey.has(key)) addTaskToDay(dateKey, key);
                    setDragTask(null);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className="border-b border-slate-200 px-2 py-2 text-left dark:border-slate-700"
                  >
                    <p className="text-[10px] text-slate-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{d.getDate()}</span>
                      <ProgressDot done={done} total={total} ratio={ratio} />
                    </div>
                  </button>
                  <div className="flex flex-1 flex-col gap-1.5 p-2 min-h-[140px]">
                    {activeTasks.length === 0 ? (
                      <p className="flex flex-1 items-center justify-center text-center text-[10px] text-slate-400 px-1">Drop tasks here</p>
                    ) : (
                      activeTasks.map(taskKey => {
                        const def = itemByKey.get(taskKey);
                        if (!def) return null;
                        return renderTaskRow(dateKey, def, true);
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!readOnly ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">Drag tasks onto a day</p>
              <div className="flex flex-wrap gap-2">
                {items.map(def => (
                  <div
                    key={def.key}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData("text/task-key", def.key);
                      setDragTask(def.key);
                    }}
                    onDragEnd={() => setDragTask(null)}
                    className="cursor-grab rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-900 active:cursor-grabbing dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-100"
                  >
                    {def.shortLabel}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {view === "day" ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Track counters for each activity today.</p>
          {items.map(def => renderTaskRow(selectedDate, def))}
        </div>
      ) : null}
    </div>
  );
};

export { toDateKey as executionDateKey };
