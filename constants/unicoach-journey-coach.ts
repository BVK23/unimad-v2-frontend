import { COACH_PIPELINE_DROPDOWN_ORDER, COACH_PIPELINE_LABELS, type CoachPipelineStage } from "./unicoach-coach-pipeline";

export type UnicoachCoachStageKey = CoachPipelineStage;

/** Full pipeline dropdown for coach student journey header + landing cards. */
export const COACH_SETTABLE_MILESTONES: { value: CoachPipelineStage; label: string }[] = COACH_PIPELINE_DROPDOWN_ORDER.map(value => ({
  value,
  label: COACH_PIPELINE_LABELS[value],
}));

export const UX_STAGE_TO_COACH_TARGET: Record<string, CoachPipelineStage> = {
  "call-1": "call_1",
  "call-2": "call_2",
  "call-3": "call_3",
  "call-4": "call_4",
};

export type CoachMilestoneAction = {
  label: string;
  targetStage: CoachPipelineStage;
  helperText: string;
  skipTaskGate?: boolean;
};

export const COACH_MILESTONE_BY_UX_STAGE: Partial<Record<string, CoachMilestoneAction>> = {
  "call-1": {
    label: "Mark Discovery call complete",
    targetStage: "call_1",
    helperText: "Mark after your Discovery session. Unlocks LinkedIn branding for the student.",
    skipTaskGate: true,
  },
  "call-2": {
    label: "Mark LinkedIn call complete",
    targetStage: "call_2",
    helperText: "Mark after your LinkedIn branding session.",
    skipTaskGate: true,
  },
  "call-3": {
    label: "Mark Application Strategy call complete",
    targetStage: "call_3",
    helperText: "Mark after your application strategy session.",
    skipTaskGate: true,
  },
  "call-4": {
    label: "Mark Interviews & VPD call complete",
    targetStage: "call_4",
    helperText: "Mark after your interview prep session.",
    skipTaskGate: true,
  },
};
