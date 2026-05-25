export type ApplicationStatus = "draft" | "applied" | "interviewing" | "offered" | "rejected";

export interface Application {
  application_id: string;
  role: string;
  company: string;
  job_description: string;
  applied_date: string | null;
  interview_date: string | null;
  status: ApplicationStatus;
  job_id?: string | null;
  /** When present, Apply Now is enabled (e.g. from job board); manual entries have no link */
  apply_url?: string | null;
  /** Location when from job board; may be missing for manually added applications */
  location?: string | null;
  /** ISO datetime when the application row was created (tracker "Added" date) */
  created_at?: string | null;
  /** ISO datetime from linked Job.posted_at when available */
  posted_at?: string | null;
  requirements?: string[];
  assets?: Record<string, unknown>;
}

export interface CreateApplicationInput {
  role: string;
  company: string;
  job_description: string;
  applied_date?: string | null;
  interview_date?: string | null;
  status: ApplicationStatus;
  job_id?: string | null;
}

export interface UpdateApplicationInput {
  role: string;
  company: string;
  job_description: string;
  applied_date?: string | null;
  interview_date?: string | null;
  status: ApplicationStatus;
}
