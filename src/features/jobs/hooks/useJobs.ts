import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../server-actions/jobs-actions";
import type { JobListResponse, JobSearchParams } from "../types";

const DEFAULT_PAGE_SIZE = 20;

export interface UseJobsOptions {
  enabled?: boolean;
}

export function useJobs(params: JobSearchParams = {}, options: UseJobsOptions = {}) {
  const { enabled = true } = options;
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? DEFAULT_PAGE_SIZE;

  return useQuery<JobListResponse>({
    queryKey: ["jobs", { ...params, page, page_size: pageSize }],
    queryFn: async () => {
      return getJobs({ ...params, page, page_size: pageSize });
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
