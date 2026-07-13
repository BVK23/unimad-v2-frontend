import { getPrepareReturnSession } from "@/lib/jobs/prepare-application-return";
import type { Application } from "@/src/features/application-tracker/types";

export type PrepareApplicationAdkContext = {
  applicationId: string;
  role: string;
  company: string;
  jobDescription: string;
  jobId: string | null;
};

/** Resolved job listing shape for `resolved_job_board_listing` session key (resume agent). */
export type ResolvedJobListingForResume = {
  status: "ok";
  application_id: string;
  job_id: string;
  title: string;
  company: string;
  role: string;
  has_description: boolean;
  /** Present when JD text is available — ADK tools should prefer this over asking the user. */
  description?: string;
  source: "application_tracker" | "job_board";
};

const readJobIdFromLocation = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("jobId")?.trim() || undefined;
};

export const resolvePrepareApplicationForAdk = (
  searchParams: { get(name: string): string | null } | null | undefined,
  applications: Application[] = []
): PrepareApplicationAdkContext | null => {
  const jobId = searchParams?.get("jobId")?.trim() || readJobIdFromLocation() || getPrepareReturnSession()?.jobId?.trim();
  if (!jobId) return null;

  const fromCache = applications.find(app => String(app.application_id) === jobId || String(app.job_id ?? "") === jobId);
  const prepareSession = getPrepareReturnSession();

  const applicationId = fromCache?.application_id?.trim() || (fromCache ? "" : jobId);
  const role = fromCache?.role?.trim() || prepareSession?.role?.trim() || "";
  const company = fromCache?.company?.trim() || prepareSession?.company?.trim() || "";
  const jobDescription = fromCache?.job_description?.trim() || prepareSession?.jobDescription?.trim() || "";
  const linkedJobId = fromCache?.job_id?.trim() || null;

  if (!applicationId && !role && !company && !jobDescription) {
    return null;
  }

  return {
    applicationId: applicationId || jobId,
    role,
    company,
    jobDescription,
    jobId: linkedJobId,
  };
};

export const buildResolvedJobListingForResume = (ctx: PrepareApplicationAdkContext): ResolvedJobListingForResume => {
  const jd = ctx.jobDescription.trim();
  return {
    status: "ok",
    application_id: ctx.applicationId,
    job_id: ctx.jobId ?? "",
    title: ctx.role,
    company: ctx.company,
    role: ctx.role,
    has_description: Boolean(jd),
    // Include JD text so ADK tools can use it without a separate session key lookup.
    ...(jd ? { description: jd.slice(0, 12000) } : {}),
    source: "application_tracker",
  };
};

export const mergePrepareApplicationIntoResumeStateDelta = (
  stateDelta: Record<string, unknown>,
  ctx: PrepareApplicationAdkContext | null
): Record<string, unknown> => {
  if (!ctx) return stateDelta;

  const jd = ctx.jobDescription.slice(0, 12000);
  const merged: Record<string, unknown> = {
    ...stateDelta,
    application_id: ctx.applicationId,
    application_role: ctx.role,
    application_company: ctx.company,
    application_jd: jd,
    resolved_job_board_listing: buildResolvedJobListingForResume(ctx),
  };
  if (ctx.jobId) {
    merged.job_id = ctx.jobId;
  }
  return merged;
};
