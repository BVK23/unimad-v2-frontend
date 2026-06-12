import { applicationHasAnyLinkedAsset, parseApplicationAssets } from "@/features/application-tracker/application-assets";
import type { Application } from "@/features/application-tracker/types";

export function findApplicationForJobId(applications: Application[], jobId: string): Application | undefined {
  return (
    applications.find(a => a.application_id === jobId) ?? applications.find(a => a.job_id != null && String(a.job_id) === String(jobId))
  );
}

export function jobHasPreparedApplication(applications: Application[], jobId: string): boolean {
  const application = findApplicationForJobId(applications, jobId);
  if (!application) return false;
  return applicationHasAnyLinkedAsset(parseApplicationAssets(application.assets));
}
