import { derivePipelineFromCalls } from "@/constants/unicoach-coach-pipeline";
import type { UnicoachCoachStageKey } from "@/constants/unicoach-coach-stages";
import { STAGE_TASK_KEYS, UX_STAGE_ORDER, type UxStageId } from "../constants/stage-task-keys";
import type { JourneyChecklist, JourneyChecklistBucket } from "../types";

export type CurriculumStage = {
  id: string;
  tasks: string[];
};

function stageTaskBucket(checklist: JourneyChecklist | null | undefined, stageId: string): JourneyChecklistBucket | undefined {
  if (!checklist || typeof checklist !== "object") return undefined;
  const v = checklist as JourneyChecklist & { tasks?: Record<string, JourneyChecklistBucket> };
  if ((v.schema_version === 3 || v.schema_version === 2) && v.tasks && typeof v.tasks === "object") {
    const bucket = v.tasks[stageId];
    return bucket && typeof bucket === "object" ? bucket : undefined;
  }
  const legacy = (checklist as Record<string, JourneyChecklistBucket>)[stageId];
  return legacy && typeof legacy === "object" ? legacy : undefined;
}

export const checklistToCompletedCompositeIds = (
  journeyChecklist: JourneyChecklist | null | undefined,
  stages: CurriculumStage[]
): string[] => {
  if (!journeyChecklist) return [];
  const out: string[] = [];
  for (const stage of stages) {
    const keys = STAGE_TASK_KEYS[stage.id];
    const bucket = stageTaskBucket(journeyChecklist, stage.id);
    if (!keys || !bucket) continue;
    keys.forEach((key, i) => {
      const entry = bucket[key];
      if (entry && typeof entry === "object" && entry.completed) {
        const taskLabel = stage.tasks[i];
        if (taskLabel) out.push(`${stage.id}:${taskLabel}`);
      }
    });
  }
  return out;
};

export const applyOptimisticChecklistTaskUpdate = (
  checklist: JourneyChecklist | null | undefined,
  stageId: string,
  taskId: string,
  completed: boolean
): JourneyChecklist => {
  const base =
    checklist && typeof checklist === "object" ? ({ ...checklist } as JourneyChecklist) : ({ schema_version: 3 } as JourneyChecklist);
  const tasksRoot = {
    ...((base.tasks as Record<string, JourneyChecklistBucket> | undefined) ?? {}),
  };
  const bucket = { ...(tasksRoot[stageId] ?? {}) };
  bucket[taskId] = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    source: "student",
  };
  tasksRoot[stageId] = bucket;
  return {
    ...base,
    schema_version: base.schema_version ?? 3,
    tasks: tasksRoot,
  };
};

export const compositeIdToServerPayload = (
  stageId: string,
  taskLabel: string,
  stages: CurriculumStage[]
): { stage_id: string; task_id: string } | null => {
  const stage = stages.find(s => s.id === stageId);
  const keys = STAGE_TASK_KEYS[stageId];
  if (!stage || !keys) return null;
  const idx = stage.tasks.indexOf(taskLabel);
  if (idx < 0 || idx >= keys.length) return null;
  return { stage_id: stageId, task_id: keys[idx] };
};

export const stageChecklistComplete = (checklist: JourneyChecklist | null | undefined, stageId: string): boolean => {
  const keys = STAGE_TASK_KEYS[stageId];
  if (!keys?.length) return true;
  const bucket = stageTaskBucket(checklist, stageId);
  if (!bucket) return false;
  return keys.every(k => {
    const e = bucket[k];
    if (k === "follow_the_system") return true;
    return e && typeof e === "object" && Boolean(e.completed);
  });
};

export const firstIncompleteStageIndex = (stages: CurriculumStage[], checklist: JourneyChecklist | null | undefined): number => {
  const idx = stages.findIndex(s => !stageChecklistComplete(checklist, s.id));
  return idx === -1 ? stages.length - 1 : idx;
};

export const maxUnlockedStageIndex = (maxUnlockedStage: string | undefined, stages: CurriculumStage[]): number => {
  if (!maxUnlockedStage) return 0;
  const idx = stages.findIndex(s => s.id === maxUnlockedStage);
  return idx === -1 ? stages.length - 1 : idx;
};

export const uxStageOrderIndex = (uxStage: string): number => {
  const i = (UX_STAGE_ORDER as readonly string[]).indexOf(uxStage);
  return i === -1 ? 0 : i;
};

export const callsCompletedCount = (calls: Record<string, unknown> | null | undefined): number => {
  if (!calls) return 0;
  let n = 0;
  for (let i = 1; i <= 4; i++) {
    const c = (calls[`call_${i}`] ?? {}) as Record<string, unknown>;
    if (i === 1) {
      if (Boolean(c.call_completed) || Boolean(c.completed)) n += 1;
    } else if (c.completed) {
      n += 1;
    }
  }
  return n;
};

export const isCallBookingUxStage = (id: string): id is UxStageId => id === "call-1" || id === "call-2" || id === "call-4";

export const stageMilestoneComplete = (stageId: string, calls: Record<string, unknown> | null | undefined): boolean => {
  if (!calls) return false;
  const map: Record<string, string> = {
    "call-1": "call_1",
    "call-2": "call_2",
    "call-3": "call_3",
    "call-4": "call_4",
  };
  const key = map[stageId];
  if (!key) return false;
  const c = (calls[key] ?? {}) as Record<string, unknown>;
  if (key === "call_1") return Boolean(c.call_completed) || Boolean(c.completed);
  return Boolean(c.completed);
};

export const isStageCompleteForSidebar = (
  stageId: string,
  calls: Record<string, unknown> | null | undefined,
  checklist: JourneyChecklist | null | undefined,
  flags?: { interview_ready_confirmed_at?: string | null; prepare_for_interview_at?: string | null } | null
): boolean => {
  if (stageMilestoneComplete(stageId, calls)) return true;
  if (stageChecklistComplete(checklist, stageId)) return true;
  if (stageId === "call-4" && Boolean(flags?.interview_ready_confirmed_at ?? flags?.prepare_for_interview_at)) {
    return stageChecklistComplete(checklist, "call-3");
  }
  return false;
};

export function deriveCoachSettableMilestone(calls: Record<string, unknown> | null | undefined): UnicoachCoachStageKey {
  return derivePipelineFromCalls(calls);
}

export function deriveCoachKanbanColumn(
  calls: Record<string, unknown> | null | undefined,
  _checklist?: JourneyChecklist | null | undefined
): UnicoachCoachStageKey {
  return deriveCoachSettableMilestone(calls);
}

/** Call-4 star sits before 100%; remaining track fills only when the student is offered. */
export const PROGRAM_PROGRESS_CALL4_ANCHOR = 90;

const NON_PROGRESS_TASK_KEYS = new Set(["follow_the_system"]);

export function countableStageTaskKeys(stageId: string): readonly string[] {
  return (STAGE_TASK_KEYS[stageId] ?? []).filter(k => !NON_PROGRESS_TASK_KEYS.has(k));
}

export function programProgressFromChecklist(
  stages: CurriculumStage[],
  checklist: JourneyChecklist | null | undefined,
  calls: Record<string, unknown> | null | undefined
): {
  percent: number;
  callMilestonePercents: [number, number, number, number];
  countableTotal: number;
  countableDone: number;
  isOffered: boolean;
} {
  const isOffered = Boolean(calls && (calls as { offered?: unknown }).offered);
  let countableTotal = 0;
  let countableDone = 0;
  const cumThrough: number[] = [];

  for (const stage of stages) {
    const keys = countableStageTaskKeys(stage.id);
    const bucket = stageTaskBucket(checklist, stage.id);
    for (const key of keys) {
      countableTotal += 1;
      const entry = bucket?.[key];
      if (entry && typeof entry === "object" && entry.completed) countableDone += 1;
    }
    cumThrough.push(countableTotal);
  }

  const anchor = PROGRAM_PROGRESS_CALL4_ANCHOR;
  const callMilestonePercents = (
    countableTotal === 0 ? [20, 40, 60, anchor] : cumThrough.map(c => Math.round((c / countableTotal) * anchor))
  ) as [number, number, number, number];

  const taskShare = countableTotal === 0 ? 0 : (countableDone / countableTotal) * anchor;
  const percent = isOffered ? 100 : Math.min(anchor, Math.round(taskShare));

  return { percent, callMilestonePercents, countableTotal, countableDone, isOffered };
}

/** Stage the student should be working after N calls are complete. */
export function stageAfterCompletedCalls(completedCalls: number, stages: CurriculumStage[]): string | null {
  if (completedCalls <= 0) return stages[0]?.id ?? null;
  if (completedCalls >= stages.length) return stages[stages.length - 1]?.id ?? null;
  return stages[completedCalls]?.id ?? null;
}

export function stageHasAnyCompletedTask(checklist: JourneyChecklist | null | undefined, stageId: string): boolean {
  const keys = STAGE_TASK_KEYS[stageId];
  if (!keys?.length) return false;
  const bucket = stageTaskBucket(checklist, stageId);
  if (!bucket) return false;
  return keys.some(k => {
    if (NON_PROGRESS_TASK_KEYS.has(k)) return false;
    const e = bucket[k];
    return e && typeof e === "object" && Boolean(e.completed);
  });
}

export function latestCompletedCallStamp(calls: Record<string, unknown> | null | undefined, completedCalls: number): string {
  if (!calls || completedCalls < 1) return "";
  const key = `call_${completedCalls}`;
  const c = (calls[key] ?? {}) as Record<string, unknown>;
  if (completedCalls === 1) {
    return String(c.call_completed_at || c.completed_at || "done");
  }
  return String(c.completed_at || "done");
}
