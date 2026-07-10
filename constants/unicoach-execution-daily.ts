import type { DailyExecutionItemKey } from "@/features/unicoach/types";
import { JOBS_BOARD_HREF, JOBS_TRACKER_HREF } from "@/src/features/jobs/jobs-url";

export type ExecutionDailyItemDef = {
  key: DailyExecutionItemKey;
  label: string;
  shortLabel: string;
  dailyTarget: number;
  hint?: string;
  href?: string;
  external?: boolean;
};

export const LINKEDIN_BRANDING_EXECUTION_ITEMS: ExecutionDailyItemDef[] = [
  {
    key: "connections",
    label: "Connections",
    shortLabel: "Connections",
    dailyTarget: 25,
    hint: "Log LinkedIn connection requests you sent today.",
    href: "/uniboard/linkedin",
  },
  {
    key: "comments",
    label: "Comments on posts",
    shortLabel: "Comments",
    dailyTarget: 5,
    hint: "Meaningful comments on posts in your niche.",
    href: "/uniboard/linkedin",
  },
  {
    key: "posts",
    label: "Posts (alternate days)",
    shortLabel: "Posts",
    dailyTarget: 3,
    hint: "Aim for at least one post every other day.",
    href: "/uniboard/studio",
  },
];

export const APPLICATIONS_EXECUTION_ITEMS: ExecutionDailyItemDef[] = [
  {
    key: "quality_applications",
    label: "Quality applications",
    shortLabel: "Quality apps",
    dailyTarget: 2,
    hint: "Use Prepare Application in Jobs for each role.",
    href: JOBS_BOARD_HREF,
  },
  {
    key: "quantity_applications",
    label: "Quantity applications",
    shortLabel: "Quantity apps",
    dailyTarget: 10,
    href: JOBS_TRACKER_HREF,
  },
];

export type ExecutionStageId = "call-2" | "call-3";

/** All five habits — used in week/month calendar views once student is in LinkedIn or Application execution. */
export const ALL_EXECUTION_ITEMS: ExecutionDailyItemDef[] = [...LINKEDIN_BRANDING_EXECUTION_ITEMS, ...APPLICATIONS_EXECUTION_ITEMS];

export function executionItemsForStage(stageId: ExecutionStageId): ExecutionDailyItemDef[] {
  if (stageId === "call-2") return LINKEDIN_BRANDING_EXECUTION_ITEMS;
  return APPLICATIONS_EXECUTION_ITEMS;
}

/** Day view = stage habits only; week/month = full habit set. */
export function executionItemsForView(stageId: ExecutionStageId, view: "day" | "week" | "month"): ExecutionDailyItemDef[] {
  return view === "day" ? executionItemsForStage(stageId) : ALL_EXECUTION_ITEMS;
}

/** @deprecated Use executionItemsForStage */
export function executionItemsForStageLegacy(includeStage6: boolean): ExecutionDailyItemDef[] {
  return includeStage6
    ? [...APPLICATIONS_EXECUTION_ITEMS, ...LINKEDIN_BRANDING_EXECUTION_ITEMS]
    : [...LINKEDIN_BRANDING_EXECUTION_ITEMS, ...APPLICATIONS_EXECUTION_ITEMS];
}
