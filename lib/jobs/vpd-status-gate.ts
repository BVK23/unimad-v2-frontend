import { VPD_FEATURE_ENABLED } from "@/constants/feature-flags";
import type { ApplicationStatus as TrackerApplicationStatus } from "@/features/application-tracker/types";
import type { Job } from "@/types/jobs";

/** UI Job enum uses `offer`; tracker Application uses `offered`. */
const VPD_ELIGIBLE_UI_STATUSES = ["applied", "interviewing", "offer", "rejected"] as const;

const toUiStatus = (trackerStatus?: TrackerApplicationStatus | null): Job["applicationStatus"] | null => {
  if (!trackerStatus) return null;
  if (trackerStatus === "offered") return "offer";
  return trackerStatus;
};

/**
 * Prepare Application VPD tab: applied and later stages only.
 * Prefer live tracker status when available (covers discovery jobs after save).
 */
export const canShowPrepareVpdTab = (job: Pick<Job, "applicationStatus">, applicationStatus?: TrackerApplicationStatus | null): boolean => {
  if (!VPD_FEATURE_ENABLED) return false;
  const status = toUiStatus(applicationStatus) ?? job.applicationStatus;
  if (!status) return false;
  return (VPD_ELIGIBLE_UI_STATUSES as readonly string[]).includes(status);
};
