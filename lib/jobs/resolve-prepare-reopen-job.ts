import { findApplicationForJobId } from "@/features/application-tracker/job-application-lookup";
import type { Application } from "@/features/application-tracker/types";
import { applicationToJob, mapBackendJobToUi } from "@/lib/jobs/job-ui-mappers";
import { getJob } from "@/src/features/jobs/server-actions/jobs-actions";
import type { Job } from "@/types/jobs";

export type PrepareReopenJobSource = "tracker" | "discovery";

export async function resolveJobForPrepareReopen(
  jobId: string,
  applications: Application[]
): Promise<{ job: Job; source: PrepareReopenJobSource } | null> {
  const application = findApplicationForJobId(applications, jobId);
  if (application) {
    return { job: applicationToJob(application), source: "tracker" };
  }

  const backendJob = await getJob(jobId);
  if (!backendJob) {
    return null;
  }

  return { job: mapBackendJobToUi(backendJob), source: "discovery" };
}
