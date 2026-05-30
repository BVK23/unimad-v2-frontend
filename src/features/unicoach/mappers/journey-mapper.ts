import type { UnicoachCoachStageKey } from "@/constants/unicoach-coach-stages";
import { STAGE_TASK_KEYS, UX_STAGE_ORDER, type UxStageId } from "../constants/stage-task-keys";
import type { JourneyChecklist, JourneyChecklistBucket } from "../types";

export type CurriculumStage = {
  id: string;
  tasks: string[];
};

/** Resolve task bucket for a stage (v2 nests under `.tasks`, v1 was flat). */
function stageTaskBucket(checklist: JourneyChecklist | null | undefined, stageId: string): JourneyChecklistBucket | undefined {
  if (!checklist || typeof checklist !== "object") return undefined;
  const v2 = checklist as JourneyChecklist & { tasks?: Record<string, JourneyChecklistBucket> };
  if (v2.schema_version === 2 && v2.tasks && typeof v2.tasks === "object") {
    const bucket = v2.tasks[stageId];
    return bucket && typeof bucket === "object" ? bucket : undefined;
  }
  const legacy = (checklist as Record<string, JourneyChecklistBucket>)[stageId];
  return legacy && typeof legacy === "object" ? legacy : undefined;
}

/** Checkbox ids used by the UI: `${stageId}:${taskLabel}` */
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

export const isCallBookingUxStage = (id: string): id is UxStageId => id === "call-1-prep" || id === "call-2" || id === "complete";

/** Stage passed based on coach-controlled call milestones. */
export const stageMilestoneComplete = (stageId: string, calls: Record<string, unknown> | null | undefined): boolean => {
  if (!calls) return false;
  const c1 = (calls.call_1 ?? {}) as Record<string, unknown>;
  const c2 = (calls.call_2 ?? {}) as Record<string, unknown>;
  const c3 = (calls.call_3 ?? {}) as Record<string, unknown>;
  switch (stageId) {
    case "call-1-prep":
      return Boolean(c1.call_completed);
    case "post-call-1":
      return Boolean(c1.portfolio_completed) || Boolean(c1.completed);
    case "call-2":
      return Boolean(c2.completed);
    case "post-call-2":
      return false;
    case "call-3":
      return false;
    case "complete":
      return Boolean(c3.completed);
    default:
      return false;
  }
};

export const isStageCompleteForSidebar = (
  stageId: string,
  calls: Record<string, unknown> | null | undefined,
  checklist: JourneyChecklist | null | undefined,
  flags?: { prepare_for_interview_at?: string | null } | null
): boolean => {
  if (stageMilestoneComplete(stageId, calls)) return true;
  if (stageId === "post-call-2") return stageChecklistComplete(checklist, stageId);
  if (stageId === "call-3") return Boolean(flags?.prepare_for_interview_at);
  return false;
};

/** Coach-settable milestone from calls_data (what the coach dropdown reflects). */
export function deriveCoachSettableMilestone(calls: Record<string, unknown> | null | undefined): UnicoachCoachStageKey {
  if (!calls) return "not_started";
  if (Boolean((calls as { program_completed?: boolean }).program_completed)) return "completed";
  const c3 = (calls.call_3 ?? {}) as Record<string, unknown>;
  if (c3.completed) return "call_3";
  const c2 = (calls.call_2 ?? {}) as Record<string, unknown>;
  if (c2.completed) return "call_2";
  const c1 = (calls.call_1 ?? {}) as Record<string, unknown>;
  if (c1.portfolio_completed || c1.completed) return "portfolio";
  if (c1.call_completed) return "call_1";
  return "not_started";
}

/** Full kanban column including student-driven stage_5 / stage_6. */
export function deriveCoachKanbanColumn(
  calls: Record<string, unknown> | null | undefined,
  checklist: JourneyChecklist | null | undefined
): UnicoachCoachStageKey {
  const c1 = (calls?.call_1 ?? {}) as Record<string, unknown>;
  if (!c1.call_completed) return "not_started";
  const c1Full = Boolean(c1.completed) || (Boolean(c1.call_completed) && Boolean(c1.portfolio_completed));
  if (!c1.portfolio_completed && !c1.completed) return "call_1";
  if (!c1Full) return "call_1";

  const c2 = (calls?.call_2 ?? {}) as Record<string, unknown>;
  if (!c2.completed) return "portfolio";

  if (!stageChecklistComplete(checklist, "post-call-2")) return "call_2";

  const gates = checklist?.gates;
  if (!gates?.prepare_for_interview_at) return "stage_5";

  const c3 = (calls?.call_3 ?? {}) as Record<string, unknown>;
  if (!c3.completed) return "stage_6";

  if (Boolean((calls as { program_completed?: boolean }).program_completed)) return "completed";
  return "call_3";
}
