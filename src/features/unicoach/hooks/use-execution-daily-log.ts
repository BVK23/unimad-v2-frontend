"use client";

import { useCallback, useEffect, useRef } from "react";
import { qk } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import { fetchUnicoachJourneyState, postExecutionDaily } from "@/features/unicoach/server-actions/unicoach-actions";
import type { DailyExecutionDayEntry, DailyExecutionItemKey, ExecutionTracker, JourneyState } from "@/features/unicoach/types";
import { normalizeDayEntry } from "@/features/unicoach/utils/execution-daily-log";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DEBOUNCE_MS = 10_000;

const normalizeTargetId = (targetUserId?: string | null) =>
  targetUserId != null && String(targetUserId).length > 0 ? String(targetUserId) : null;

function patchDailyLog(journey: JourneyState | undefined, dateKey: string, entry: DailyExecutionDayEntry): JourneyState | undefined {
  if (!journey) return journey;
  return {
    ...journey,
    execution_tracker: {
      ...journey.execution_tracker,
      daily_log: {
        ...(journey.execution_tracker?.daily_log ?? {}),
        [dateKey]: entry,
      },
    } as ExecutionTracker,
  };
}

export function buildDayEntryWithCount(
  entry: DailyExecutionDayEntry,
  taskKey: DailyExecutionItemKey,
  count: number
): DailyExecutionDayEntry {
  const tasks = entry.tasks?.includes(taskKey) ? entry.tasks : [...(entry.tasks ?? []), taskKey];
  const counts = { ...entry.counts };
  if (count <= 0) delete counts[taskKey];
  else counts[taskKey] = count;
  return { tasks, counts };
}

export function buildDayEntryWithTask(entry: DailyExecutionDayEntry, taskKey: DailyExecutionItemKey): DailyExecutionDayEntry {
  if (entry.tasks?.includes(taskKey)) return entry;
  return {
    tasks: [...(entry.tasks ?? []), taskKey],
    counts: { ...entry.counts, [taskKey]: entry.counts?.[taskKey] ?? 0 },
  };
}

export function useExecutionDailyLog(journeyUserId?: string | null, readOnly = false) {
  const qc = useQueryClient();
  const tid = normalizeTargetId(journeyUserId);
  const queryKey = qk.journey(tid);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingEntries = useRef<Map<string, DailyExecutionDayEntry>>(new Map());

  const { data: journey } = useQuery({
    queryKey,
    queryFn: () => fetchUnicoachJourneyState(tid ?? undefined),
    staleTime: 15_000,
  });

  const dailyLog = journey?.execution_tracker?.daily_log ?? {};

  const mutation = useMutation({
    mutationFn: postExecutionDaily,
    onSuccess: data => {
      if (data.execution_tracker) {
        qc.setQueryData<JourneyState>(queryKey, old =>
          old ? { ...old, execution_tracker: data.execution_tracker as ExecutionTracker } : old
        );
      }
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const flushEntry = useCallback(
    (dateKey: string, entry: DailyExecutionDayEntry) => {
      mutation.mutate({ date: dateKey, entry, user_id: tid ?? undefined });
    },
    [mutation, tid]
  );

  const schedulePersist = useCallback(
    (dateKey: string, entry: DailyExecutionDayEntry) => {
      if (readOnly) return;
      pendingEntries.current.set(dateKey, entry);
      const existing = debounceTimers.current.get(dateKey);
      if (existing) clearTimeout(existing);
      debounceTimers.current.set(
        dateKey,
        setTimeout(() => {
          debounceTimers.current.delete(dateKey);
          const pending = pendingEntries.current.get(dateKey);
          if (pending) {
            pendingEntries.current.delete(dateKey);
            flushEntry(dateKey, pending);
          }
        }, DEBOUNCE_MS)
      );
    },
    [flushEntry, readOnly]
  );

  const setDayEntry = useCallback(
    (dateKey: string, entry: DailyExecutionDayEntry) => {
      if (readOnly) return;
      qc.setQueryData<JourneyState>(queryKey, old => patchDailyLog(old, dateKey, entry));
      schedulePersist(dateKey, entry);
    },
    [qc, queryKey, readOnly, schedulePersist]
  );

  const getEntry = useCallback((dateKey: string) => normalizeDayEntry(dailyLog[dateKey]), [dailyLog]);

  const setCount = useCallback(
    (dateKey: string, taskKey: DailyExecutionItemKey, count: number) => {
      const entry = getEntry(dateKey);
      setDayEntry(dateKey, buildDayEntryWithCount(entry, taskKey, count));
    },
    [getEntry, setDayEntry]
  );

  const addTaskToDay = useCallback(
    (dateKey: string, taskKey: DailyExecutionItemKey) => {
      const entry = getEntry(dateKey);
      setDayEntry(dateKey, buildDayEntryWithTask(entry, taskKey));
    },
    [getEntry, setDayEntry]
  );

  useEffect(() => {
    const timers = debounceTimers.current;
    const pending = pendingEntries.current;
    const mutate = mutation.mutate;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      for (const [dateKey, entry] of pending.entries()) {
        mutate({ date: dateKey, entry, user_id: tid ?? undefined });
      }
      pending.clear();
    };
  }, [mutation.mutate, tid]);

  return {
    dailyLog,
    getEntry,
    setDayEntry,
    setCount,
    addTaskToDay,
    isSyncing: mutation.isPending,
  };
}
