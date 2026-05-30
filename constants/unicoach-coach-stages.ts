/** Must match backend UNICOACH_STAGE_ORDER (Django). */
export const UNICOACH_COACH_STAGE_ORDER = [
  "not_started",
  "call_1",
  "portfolio",
  "call_2",
  "stage_5",
  "stage_6",
  "call_3",
  "completed",
] as const;

export type UnicoachCoachStageKey = (typeof UNICOACH_COACH_STAGE_ORDER)[number];

/** Columns coaches cannot drop students into (student task completion only). */
export const USER_ONLY_COACH_COLUMNS: ReadonlySet<UnicoachCoachStageKey> = new Set(["stage_5", "stage_6"]);

export const UNICOACH_COACH_STAGE_LABELS: Record<UnicoachCoachStageKey, string> = {
  not_started: "Not Started",
  call_1: "Call 1",
  portfolio: "Portfolio",
  call_2: "Call 2",
  stage_5: "Stage 5",
  stage_6: "Pre Call 3",
  call_3: "Call 3",
  completed: "Program Completed",
};

export const coachColumnId = (stageKey: UnicoachCoachStageKey) => `column-${stageKey}`;
