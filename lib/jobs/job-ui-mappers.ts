import type { Application, ApplicationStatus } from "@/features/application-tracker/types";
import type { BackendJob } from "@/features/jobs/types";
import type { Job } from "@/types/jobs";

function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return null;
  }
}

/** Map a tracker application row to the shared Job card shape. */
export function applicationToJob(app: Application): Job {
  const statusMap: ApplicationStatus | "offer" = app.status === "offered" ? "offer" : app.status;
  const posted = formatShortDate(app.posted_at);
  const created = formatShortDate(app.created_at);
  const postedDate = app.applied_date || posted || created || "—";

  return {
    id: app.application_id,
    role: app.role,
    company: app.company,
    logo: "",
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
  const postedLabel = dateSource
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dateSource))
    : "Recently posted";

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
