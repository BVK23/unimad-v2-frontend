import type { DailyExecutionItemKey } from "@/features/unicoach/types";

export type ExecutionDailyItemDef = {
  key: DailyExecutionItemKey;
  label: string;
  shortLabel: string;
  dailyTarget: number;
};

export const STAGE5_EXECUTION_ITEMS: ExecutionDailyItemDef[] = [
  { key: "quality_applications", label: "Quality applications", shortLabel: "Quality apps", dailyTarget: 2 },
  { key: "quantity_applications", label: "Quantity applications", shortLabel: "Quantity apps", dailyTarget: 10 },
  { key: "connections", label: "Connections", shortLabel: "Connections", dailyTarget: 25 },
  { key: "comments", label: "Comments on posts", shortLabel: "Comments", dailyTarget: 5 },
  { key: "posts", label: "Posts (alternate days)", shortLabel: "Posts", dailyTarget: 3 },
];

export const STAGE6_EXECUTION_EXTRA: ExecutionDailyItemDef[] = [
  { key: "vpd", label: "VPD work", shortLabel: "VPD", dailyTarget: 1 },
  { key: "interview_prep", label: "Interview prep", shortLabel: "Interview", dailyTarget: 1 },
];

export function executionItemsForStage(includeStage6: boolean): ExecutionDailyItemDef[] {
  return includeStage6 ? [...STAGE5_EXECUTION_ITEMS, ...STAGE6_EXECUTION_EXTRA] : STAGE5_EXECUTION_ITEMS;
}
