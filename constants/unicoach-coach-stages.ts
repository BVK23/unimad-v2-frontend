/** Must match backend UNICOACH_STAGE_ORDER (Django). */
export const UNICOACH_COACH_STAGE_ORDER = ["not_started", "call_1", "portfolio", "call_2", "call_3", "completed"] as const;

export type UnicoachCoachStageKey = (typeof UNICOACH_COACH_STAGE_ORDER)[number];

export const UNICOACH_COACH_STAGE_LABELS: Record<UnicoachCoachStageKey, string> = {
  not_started: "Not Started",
  call_1: "Call 1",
  portfolio: "Portfolio",
  call_2: "Call 2",
  call_3: "Call 3",
  completed: "Completed",
};

export const coachColumnId = (stageKey: UnicoachCoachStageKey) => `column-${stageKey}`;
