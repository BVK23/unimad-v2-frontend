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
