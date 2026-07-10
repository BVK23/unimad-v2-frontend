import type { ExecutionDailyItemDef } from "@/constants/unicoach-execution-daily";
import type { DailyExecutionDayEntry, DailyExecutionItemKey } from "@/features/unicoach/types";

const ITEM_KEYS: DailyExecutionItemKey[] = [
  "quality_applications",
  "quantity_applications",
  "connections",
  "comments",
  "posts",
  "interview_prep",
  "vpd",
];

function isItemKey(k: string): k is DailyExecutionItemKey {
  return ITEM_KEYS.includes(k as DailyExecutionItemKey);
}

/** Normalize legacy boolean daily_log rows into { tasks, counts }. */
export function normalizeDayEntry(raw: unknown): DailyExecutionDayEntry {
  if (!raw || typeof raw !== "object") {
    return { tasks: [], counts: {} };
  }
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.tasks) || (obj.counts && typeof obj.counts === "object")) {
    const tasks = Array.isArray(obj.tasks) ? obj.tasks.filter(isItemKey) : [];
    const counts: DailyExecutionDayEntry["counts"] = {};
    if (obj.counts && typeof obj.counts === "object") {
      for (const [k, v] of Object.entries(obj.counts as Record<string, unknown>)) {
        if (isItemKey(k) && typeof v === "number" && v >= 0) counts[k] = v;
      }
    }
    return { tasks, counts };
  }

  const tasks: DailyExecutionItemKey[] = [];
  const counts: DailyExecutionDayEntry["counts"] = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isItemKey(k)) continue;
    if (v === true) {
      tasks.push(k);
      counts[k] = 1;
    } else if (typeof v === "number" && v >= 0) {
      tasks.push(k);
      counts[k] = v;
    }
  }
  return { tasks, counts };
}

export function countTasksWithProgress(entry: DailyExecutionDayEntry, itemKeys: DailyExecutionItemKey[]): { done: number; total: number } {
  let done = 0;
  for (const k of itemKeys) {
    if ((entry.counts?.[k] ?? 0) > 0) done += 1;
  }
  return { done, total: itemKeys.length };
}

export function getCount(entry: DailyExecutionDayEntry, key: DailyExecutionItemKey): number {
  return entry.counts?.[key] ?? 0;
}

/** Clamp a habit count to its configured daily target. */
export function clampExecutionCount(count: number, dailyTarget: number): number {
  return Math.max(0, Math.min(dailyTarget, count));
}

/** Posts alternate days — not counted toward daily target on off-days. */
export function isPostsApplicableForDate(dateKey: string): boolean {
  const day = parseInt(dateKey.slice(-2), 10);
  return day % 2 === 1;
}

export function applicableExecutionItems(
  items: ExecutionDailyItemDef[],
  dateKey: string,
  entry?: DailyExecutionDayEntry
): ExecutionDailyItemDef[] {
  return items.filter(item => {
    if (item.key !== "posts") return true;
    if (isPostsApplicableForDate(dateKey)) return true;
    // Students can log posts on any day in day/week view — credit completion on the calendar too.
    const postsDef = items.find(i => i.key === "posts");
    if (entry && postsDef && getCount(entry, "posts") >= postsDef.dailyTarget) return true;
    return false;
  });
}

export type DayHabitScore = {
  atTarget: number;
  withProgress: number;
  applicable: number;
};

export function scoreDayHabits(entry: DailyExecutionDayEntry, items: ExecutionDailyItemDef[], dateKey: string): DayHabitScore {
  const applicable = applicableExecutionItems(items, dateKey, entry);
  let atTarget = 0;
  let withProgress = 0;
  for (const item of applicable) {
    const count = getCount(entry, item.key);
    if (count > 0) withProgress += 1;
    if (count >= item.dailyTarget) atTarget += 1;
  }
  return { atTarget, withProgress, applicable: applicable.length };
}

/** Month calendar colour tier from habits-at-target count. */
export function monthHabitColorClass(atTarget: number): string {
  if (atTarget <= 0) return "";
  if (atTarget === 1) return "bg-red-500 text-white";
  if (atTarget === 2) return "bg-orange-500 text-white";
  if (atTarget === 3) return "bg-yellow-400 text-slate-900";
  return "bg-blue-500 text-white";
}
