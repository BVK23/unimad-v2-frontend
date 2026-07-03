/** @deprecated Use `unicoach-coach-pipeline.ts` — kept for kanban column ids. */
export {
  COACH_PIPELINE_ORDER as UNICOACH_COACH_STAGE_ORDER,
  type CoachPipelineStage as UnicoachCoachStageKey,
  COACH_PIPELINE_LABELS as UNICOACH_COACH_STAGE_LABELS,
} from "./unicoach-coach-pipeline";

export const USER_ONLY_COACH_COLUMNS: ReadonlySet<string> = new Set();

export const coachColumnId = (stageKey: string) => `column-${stageKey}`;
