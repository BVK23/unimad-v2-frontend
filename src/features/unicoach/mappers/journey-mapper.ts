import { STAGE_TASK_KEYS, UX_STAGE_ORDER, type UxStageId } from "../constants/stage-task-keys";
import type { JourneyChecklist } from "../types";

export type CurriculumStage = {
  id: string;
  tasks: string[];
};

/** Checkbox ids used by the UI: `${stageId}:${taskLabel}` */
export const checklistToCompletedCompositeIds = (
  journeyChecklist: JourneyChecklist | null | undefined,
  stages: CurriculumStage[]
): string[] => {
  if (!journeyChecklist) return [];
  const out: string[] = [];
  for (const stage of stages) {
    const keys = STAGE_TASK_KEYS[stage.id];
    const bucket = journeyChecklist[stage.id];
    if (!keys || !bucket || typeof bucket !== "object") continue;
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
  const bucket = checklist?.[stageId];
  if (!bucket || typeof bucket !== "object") return false;
  return keys.every(k => {
    const e = bucket[k];
    return e && typeof e === "object" && Boolean(e.completed);
  });
};

export const firstIncompleteStageIndex = (stages: CurriculumStage[], checklist: JourneyChecklist | null | undefined): number => {
  const idx = stages.findIndex(s => !stageChecklistComplete(checklist, s.id));
  return idx === -1 ? stages.length - 1 : idx;
};

export const uxStageOrderIndex = (uxStage: string): number => {
  const i = (UX_STAGE_ORDER as readonly string[]).indexOf(uxStage);
  return i === -1 ? 0 : i;
};

export const callsCompletedCount = (calls: Record<string, unknown> | null | undefined): number => {
  if (!calls) return 0;
  const c1 = (calls.call_1 ?? {}) as Record<string, unknown>;
  const c2 = (calls.call_2 ?? {}) as Record<string, unknown>;
  const c3 = (calls.call_3 ?? {}) as Record<string, unknown>;
  const call1Done = Boolean(c1.completed) || (Boolean(c1.call_completed) && Boolean(c1.portfolio_completed));
  let n = 0;
  if (call1Done) n += 1;
  if (c2.completed) n += 1;
  if (c3.completed) n += 1;
  return n;
};

export const isCallBookingUxStage = (id: string): id is UxStageId => id === "call-1-prep" || id === "call-2" || id === "call-3";
