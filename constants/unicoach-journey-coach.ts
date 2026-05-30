import type { UnicoachCoachStageKey } from "./unicoach-coach-stages";

/** Coach-settable milestones (matches kanban columns coaches can drag to). */
export const COACH_SETTABLE_MILESTONES: { value: UnicoachCoachStageKey; label: string }[] = [
  { value: "not_started", label: "Not Started (Stage 1)" },
  { value: "call_1", label: "Call 1 complete (Stage 2)" },
  { value: "portfolio", label: "Portfolio complete (Stage 3)" },
  { value: "call_2", label: "Call 2 complete (Stage 4)" },
  { value: "call_3", label: "Call 3 complete" },
  { value: "completed", label: "Program completed" },
];

/** Milestones coaches may select only after Call 2 is marked complete. */
export const COACH_LATE_MILESTONES = new Set<UnicoachCoachStageKey>(["call_3", "completed"]);

/** Map UX journey stage id → coach kanban `target_stage` (legacy; prefer COACH_SETTABLE_MILESTONES). */
export const UX_STAGE_TO_COACH_TARGET: Record<string, UnicoachCoachStageKey> = {
  "call-1-prep": "not_started",
  "post-call-1": "call_1",
  "call-2": "portfolio",
  "post-call-2": "call_2",
  "call-3": "call_2",
  complete: "call_3",
};

export type CoachMilestoneAction = {
  label: string;
  targetStage: UnicoachCoachStageKey;
  helperText: string;
  /** When true, milestone button is enabled without waiting for stage tasks. */
  skipTaskGate?: boolean;
};

/** Coach milestone button when viewing a student's active UX stage. */
export const COACH_MILESTONE_BY_UX_STAGE: Partial<Record<string, CoachMilestoneAction>> = {
  "call-1-prep": {
    label: "Complete Call 1",
    targetStage: "call_1",
    helperText: "Mark Call 1 complete after your session. Stage 2 unlocks for the student.",
  },
  "post-call-1": {
    label: "Complete Stage 2",
    targetStage: "portfolio",
    helperText: "Mark Stage 2 complete once portfolio work is done. Stage 3 unlocks for the student.",
  },
  "call-2": {
    label: "Complete Call 2",
    targetStage: "call_2",
    helperText: "Mark Call 2 complete after your session together.",
    skipTaskGate: true,
  },
  complete: {
    label: "Complete Call 3",
    targetStage: "call_3",
    helperText: "Mark Call 3 complete after your final session.",
    skipTaskGate: true,
  },
};
