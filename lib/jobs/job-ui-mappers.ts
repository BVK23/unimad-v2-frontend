import type { Application, ApplicationStatus } from "@/features/application-tracker/types";
import type { BackendJob } from "@/features/jobs/types";
import type { Job } from "@/types/jobs";
import { formatRelativeTimeFromNow } from "@/utils/format-relative-time";

/** Map a tracker application row to the shared Job card shape. */
export function applicationToJob(app: Application): Job {
  const statusMap: ApplicationStatus | "offer" = app.status === "offered" ? "offer" : app.status;
  const relativeSource = app.posted_at ?? app.created_at;
  const postedDate = relativeSource ? formatRelativeTimeFromNow(relativeSource, "—") : app.applied_date || "—";

  return {
    id: app.application_id,
    role: app.role,
    company: app.company,
    logo: app.company_logo_url ?? "",
    location: app.location?.trim() || "—",
    postedDate,
    matchScore: 95,
    description: app.job_description ?? "",
    requirements: app.requirements?.length ? app.requirements : undefined,
    applicationStatus: statusMap as Job["applicationStatus"],
    applyUrl: app.apply_url ?? undefined,
  };
}

/** Map a job-board API job to the shared Job card shape. */
export function mapBackendJobToUi(job: BackendJob): Job {
  const dateSource = job.posted_at ?? job.fetched_at;
  const postedLabel = formatRelativeTimeFromNow(dateSource);

  return {
    id: job.id,
    role: job.title ?? "Untitled role",
    company: job.company ?? "Company",
    logo: job.company_logo_url ?? "",
    location: job.location ?? "Location not specified",
    postedDate: postedLabel,
    matchScore: 95,
    isRecommended: true,
    isSponsoring: job.visa_sponsorship,
    description: job.description ?? "",
    requirements: job.requirements ?? [],
    isSaved: job.is_saved,
    applyUrl: job.apply_url ?? job.source_url ?? undefined,
  };
}
