import type { JobSearchParams } from "./types";

/** UI chip labels wired to GET /api/jobs/ query params. */
export const LOCATION_FILTER_OPTIONS = ["Remote", "On-site", "Hybrid"] as const;
export const JOB_TYPE_FILTER_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export const VISA_FILTER_OPTION = "Visa Sponsorship" as const;

const LOCATION_TO_API: Record<string, NonNullable<JobSearchParams["location_type"]>> = {
  Remote: "remote",
  "On-site": "onsite",
  Hybrid: "hybrid",
};

const JOB_TYPE_TO_API: Record<string, string> = {
  "Full-time": "full-time",
  "Part-time": "part-time",
  Contract: "contract",
  Internship: "internship",
};

/** Maps active filter chips to API-supported search params (one value per field). */
export function activeFiltersToSearchParams(activeFilters: string[]): Partial<JobSearchParams> {
  const params: Partial<JobSearchParams> = {};

  for (const label of activeFilters) {
    const locationType = LOCATION_TO_API[label];
    if (locationType) {
      params.location_type = locationType;
      break;
    }
  }

  for (const label of activeFilters) {
    const jobType = JOB_TYPE_TO_API[label];
    if (jobType) {
      params.job_type = jobType;
      break;
    }
  }

  if (activeFilters.includes(VISA_FILTER_OPTION)) {
    params.visa_sponsorship = true;
  }

  return params;
}
