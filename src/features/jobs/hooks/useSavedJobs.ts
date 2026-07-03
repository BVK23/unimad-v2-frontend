import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { getSavedJobs } from "../server-actions/jobs-actions";
import type { JobListResponse } from "../types";

export interface UseSavedJobsOptions {
  enabled?: boolean;
}

export function useSavedJobs(page = 1, options: UseSavedJobsOptions = {}) {
  const { enabled = true } = options;
  const actAs = useCoachActAsSession();

  return useQuery<JobListResponse>({
    queryKey: withCoachActAsScope(["savedJobs", page] as const, actAs),
    queryFn: async () => getSavedJobs(page),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
