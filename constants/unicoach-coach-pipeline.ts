/** Coach pipeline stages — must match Django `COACH_PIPELINE_ORDER`. */
export const COACH_PIPELINE_ORDER = [
  "not_started",
  "call_1",
  "call_2",
  "call_3",
  "call_4",
  "completed",
  "interviewing",
  "offered",
  "refunded",
] as const;

export type CoachPipelineStage = (typeof COACH_PIPELINE_ORDER)[number];

/** Main journey mountain (left → right). */
export const MOUNTAIN_GRAPH_ORDER = ["not_started", "call_1", "call_2", "call_3", "call_4", "completed"] as const;

export type MountainGraphStage = (typeof MOUNTAIN_GRAPH_ORDER)[number];

/** Off-ridge markers to the right of the mountain. */
export const SPECIAL_GRAPH_ORDER = ["offered", "refunded"] as const;

export type SpecialGraphStage = (typeof SPECIAL_GRAPH_ORDER)[number];

export const COACH_PIPELINE_LABELS: Record<CoachPipelineStage, string> = {
  not_started: "Not started",
  call_1: "Discovery call",
  call_2: "LinkedIn branding",
  call_3: "Application Strategy",
  call_4: "Interview mastery",
  completed: "Completed",
  interviewing: "Interviewing",
  offered: "Offered",
  refunded: "Refunded",
};

/** Dropdown options for coaches (excludes legacy "started"). */
export const COACH_PIPELINE_DROPDOWN_ORDER: CoachPipelineStage[] = [
  "not_started",
  "call_1",
  "call_2",
  "call_3",
  "call_4",
  "completed",
  "interviewing",
  "offered",
  "refunded",
];

export const MOUNTAIN_SHORT_LABELS: Record<MountainGraphStage, string> = {
  not_started: "NS",
  call_1: "DC",
  call_2: "LB",
  call_3: "AS",
  call_4: "IM",
  completed: "Done",
};

export function mountainStageForPipeline(pipeline: CoachPipelineStage): MountainGraphStage | SpecialGraphStage {
  if ((MOUNTAIN_GRAPH_ORDER as readonly string[]).includes(pipeline)) {
    return pipeline as MountainGraphStage;
  }
  if (pipeline === "interviewing") return "call_4";
  if (pipeline === "offered" || pipeline === "refunded") return pipeline;
  return "not_started";
}

export function pipelineStageBadgeClasses(stage: CoachPipelineStage): string {
  const base = "shrink-0 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold";
  switch (stage) {
    case "not_started":
      return `${base} bg-red-100 text-red-900 dark:bg-red-950/55 dark:text-red-200`;
    case "call_1":
    case "call_2":
    case "call_3":
    case "call_4":
      return `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200`;
    case "interviewing":
      return `${base} bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200`;
    case "offered":
      return `${base} bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200`;
    case "refunded":
      return `${base} bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  }
}

export function derivePipelineFromCalls(calls: Record<string, unknown> | null | undefined): CoachPipelineStage {
  if (!calls) return "not_started";
  const explicit = calls.pipeline_stage;
  if (typeof explicit === "string" && (COACH_PIPELINE_ORDER as readonly string[]).includes(explicit)) {
    return explicit as CoachPipelineStage;
  }
  if (calls.refunded) return "refunded";
  if (calls.offered) return "offered";
  if (calls.program_completed) return "completed";
  if (calls.interviewing) return "interviewing";
  const c1 = (calls.call_1 ?? {}) as Record<string, unknown>;
  if (!c1.call_completed && !c1.completed) return "not_started";
  const c2 = (calls.call_2 ?? {}) as Record<string, unknown>;
  if (!c2.completed) return "call_1";
  const c3 = (calls.call_3 ?? {}) as Record<string, unknown>;
  if (!c3.completed) return "call_2";
  const c4 = (calls.call_4 ?? {}) as Record<string, unknown>;
  if (!c4.completed) return "call_3";
  return "call_4";
}
