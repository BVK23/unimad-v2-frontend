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
