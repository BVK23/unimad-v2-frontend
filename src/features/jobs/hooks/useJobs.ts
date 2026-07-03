import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../server-actions/jobs-actions";
import type { JobListResponse, JobSearchParams } from "../types";

const DEFAULT_PAGE_SIZE = 20;

export interface UseJobsOptions {
  enabled?: boolean;
}

export function useJobs(params: JobSearchParams = {}, options: UseJobsOptions = {}) {
  const { enabled = true } = options;
  const actAs = useCoachActAsSession();
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? DEFAULT_PAGE_SIZE;

  return useQuery<JobListResponse>({
    queryKey: withCoachActAsScope(["jobs", { ...params, page, page_size: pageSize }] as const, actAs),
    queryFn: async () => {
      return getJobs({ ...params, page, page_size: pageSize });
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
