"use client";

import { useMemo, useState } from "react";
import type { ExecutionDailyItemDef } from "@/constants/unicoach-execution-daily";
import { useExecutionDailyLog } from "@/features/unicoach/hooks/use-execution-daily-log";
import type { DailyExecutionItemKey } from "@/features/unicoach/types";
import { getCount, monthHabitColorClass, scoreDayHabits } from "@/features/unicoach/utils/execution-daily-log";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function MonthHabitDot({ atTarget }: { atTarget: number }) {
  if (atTarget <= 0) return null;
  return (
    <span
      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold tabular-nums ${monthHabitColorClass(atTarget)}`}
    >
      {atTarget}
    </span>
  );
}

function CounterControls({
  count,
  target,
  readOnly,
  onChange,
  compact,
}: {
  count: number;
  target: number;
  readOnly: boolean;
  onChange: (next: number) => void;
  compact?: boolean;
}) {
  const btnClass =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700";

  return (
    <div className={`flex items-center gap-1 ${compact ? "w-full justify-between" : ""}`}>
      <button
        type="button"
        disabled={readOnly || count <= 0}
        onClick={() => onChange(Math.max(0, count - 1))}
        className={btnClass}
        aria-label="Decrease"
      >
        <Minus size={11} />
      </button>
      <span className="text-center text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        {count}/{target}
      </span>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(Math.min(999, count + 1))}
        className={btnClass}
        aria-label="Increase"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

type Props = {
  items: ExecutionDailyItemDef[];
  journeyUserId?: string | null;
  readOnly?: boolean;
  mode: "week" | "month";
  selectedDate?: string;
  onDateSelect: (dateKey: string) => void;
};

export const UnicoachExecutionCalendar = ({ items, journeyUserId, readOnly = false, mode, selectedDate, onDateSelect }: Props) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [dragTask, setDragTask] = useState<DailyExecutionItemKey | null>(null);

  const { getEntry, setCount, addTaskToDay } = useExecutionDailyLog(journeyUserId, readOnly);

  const itemByKey = useMemo(() => new Map(items.map(i => [i.key, i])), [items]);

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
    const day = cursor.getDay();
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return x;
    });
  }, [cursor]);

  const navLabel = useMemo(() => {
    if (mode === "week") {
      const a = weekDays[0];
      const b = weekDays[6];
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `${fmt(a)} – ${fmt(b)}`;
    }
    return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [mode, cursor, weekDays]);

  const stepNav = (delta: number) => {
    const n = new Date(cursor);
    if (mode === "month") n.setMonth(n.getMonth() + delta);
    else n.setDate(n.getDate() + delta * 7);
    setCursor(n);
  };

  const renderCompactTask = (dateKey: string, def: ExecutionDailyItemDef) => {
    const entry = getEntry(dateKey);
    const count = getCount(entry, def.key);
    const atTarget = count >= def.dailyTarget;

    return (
      <div
        key={def.key}
        className={`rounded-lg border px-2 py-2 dark:bg-slate-900/40 ${
          atTarget ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40" : "border-slate-200 bg-white dark:border-slate-700"
        }`}
      >
        <p className="mb-1.5 text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100">{def.shortLabel}</p>
        <CounterControls count={count} target={def.dailyTarget} readOnly={readOnly} onChange={n => setCount(dateKey, def.key, n)} compact />
      </div>
    );
  };

  return (
    <div className="space-y-3">
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

      {mode === "month" ? (
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
              const { atTarget } = scoreDayHabits(getEntry(key), items, key);
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onDateSelect(key)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] transition-colors ${
                    isSelected
                      ? "border-brand-500 ring-1 ring-brand-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-400">{d.getDate()}</span>
                  <MonthHabitDot atTarget={atTarget} />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-500" /> 1 habit
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-orange-500" /> 2
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-400" /> 3
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-500" /> 4+
            </span>
          </div>
        </div>
      ) : null}

      {mode === "week" ? (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekDays.map(d => {
              const dateKey = toDateKey(d);
              const entry = getEntry(dateKey);
              const activeTasks = entry.tasks ?? [];
              const { atTarget } = scoreDayHabits(entry, items, dateKey);
              const isSelected = dateKey === selectedDate;

              return (
                <div
                  key={dateKey}
                  className={`flex w-[156px] flex-shrink-0 flex-col rounded-xl border bg-slate-50/80 dark:bg-slate-900/30 ${
                    isSelected ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200 dark:border-slate-700"
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
                    onClick={() => onDateSelect(dateKey)}
                    className="border-b border-slate-200 px-2 py-2 text-left dark:border-slate-700"
                  >
                    <p className="text-[10px] text-slate-500">{d.toLocaleDateString(undefined, { weekday: "short" })}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{d.getDate()}</span>
                      {atTarget > 0 ? (
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${monthHabitColorClass(atTarget)}`}
                        >
                          {atTarget}
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <div className="flex min-h-[148px] flex-1 flex-col gap-1.5 p-2">
                    {activeTasks.length === 0 ? (
                      <p className="flex flex-1 items-center justify-center px-1 text-center text-[10px] text-slate-400">Drop tasks here</p>
                    ) : (
                      activeTasks.map(taskKey => {
                        const def = itemByKey.get(taskKey);
                        if (!def) return null;
                        return renderCompactTask(dateKey, def);
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!readOnly ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
              <p className="mb-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">Drag habits onto a day</p>
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
    </div>
  );
};

export { toDateKey as executionDateKey };
