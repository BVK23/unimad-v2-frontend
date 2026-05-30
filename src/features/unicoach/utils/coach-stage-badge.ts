import type { UnicoachCoachStageKey } from "@/constants/unicoach-coach-stages";

export function coachStageBadgeClasses(stage: UnicoachCoachStageKey): string {
  const base = "shrink-0 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  switch (stage) {
    case "not_started":
      return `${base} bg-red-100 text-red-900 dark:bg-red-950/55 dark:text-red-200`;
    case "call_1":
    case "portfolio":
    case "call_2":
      return `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200`;
    case "stage_5":
    case "stage_6":
      return `${base} bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200`;
    case "call_3":
      return `${base} bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  }
}
