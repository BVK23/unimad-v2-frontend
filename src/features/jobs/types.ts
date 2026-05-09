export type LocationType = "remote" | "hybrid" | "onsite" | null;

export interface BackendJob {
  id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  location: string | null;
  location_type: LocationType;
  visa_sponsorship: boolean;
  job_type: string | null;
  experience_level: string | null;
  description: string | null;
  requirements: string[];
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  apply_url: string | null;
  posted_at: string | null;
  about_company: string | null;
  is_saved: boolean;
  // Optional fields used in v1 for analytics / applications
  user_application_id?: string | null;
}

export interface Pagination {
  total_count: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface JobListResponse {
  jobs: BackendJob[];
  pagination: Pagination;
  query_used?: string;
  fallback_used?: boolean;
  recommended_context?: {
    primary_role?: string;
    experience_roles?: string[];
  };
  jobs_for_experience?: BackendJob[];
  experience_role_label?: string;
}

export interface JobSearchParams {
  recommended?: number | string;
  q?: string;
  location?: string;
  location_type?: Exclude<LocationType, null>;
  visa_sponsorship?: boolean;
  job_type?: string;
  experience_level?: string;
  page?: number;
  page_size?: number;
}
