import type { JobSearchParams } from "./types";

/** UI chip labels wired to GET /api/jobs/ query params. */
export const LOCATION_FILTER_OPTIONS = ["Remote", "On-site", "Hybrid"] as const;
export const JOB_TYPE_FILTER_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export const EXPERIENCE_LEVEL_FILTER_OPTIONS = ["Entry", "Mid", "Senior", "Lead"] as const;
export const SPONSORED_FILTER_OPTIONS = ["Yes", "No"] as const;

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

const EXPERIENCE_LEVEL_TO_API: Record<string, string> = {
  Entry: "entry",
  Mid: "mid",
  Senior: "senior",
  Lead: "lead",
};

const SPONSORED_TO_API: Record<(typeof SPONSORED_FILTER_OPTIONS)[number], Pick<JobSearchParams, "visa_sponsorship">> = {
  Yes: { visa_sponsorship: true },
  No: { visa_sponsorship: false },
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

  for (const label of activeFilters) {
    const experienceLevel = EXPERIENCE_LEVEL_TO_API[label];
    if (experienceLevel) {
      params.experience_level = experienceLevel;
      break;
    }
  }

  for (const label of activeFilters) {
    if ((SPONSORED_FILTER_OPTIONS as readonly string[]).includes(label)) {
      Object.assign(params, SPONSORED_TO_API[label as (typeof SPONSORED_FILTER_OPTIONS)[number]]);
      break;
    }
  }

  return params;
}

/** Chip label for sponsored filters so "Yes"/"No" read clearly in the filter bar. */
export function formatFilterChipLabel(filter: string): string {
  if ((SPONSORED_FILTER_OPTIONS as readonly string[]).includes(filter)) {
    return `Sponsored: ${filter}`;
  }
  return filter;
}
