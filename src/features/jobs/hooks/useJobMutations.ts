import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveJob, unsaveJob } from "../server-actions/jobs-actions";
import type { JobListResponse } from "../types";

interface MutationArgs {
  jobId: string;
  jobTitle?: string;
}

export interface UseJobMutationOptions {
  /** Called after API success; receives jobId and new saved state so UI (e.g. modal) can update immediately. */
  onSuccess?: (jobId: string, saved: boolean) => void;
  onError?: (error: unknown) => void;
}

function updateJobsCache(jobId: string, saved: boolean, old: unknown): unknown {
  if (!old || typeof old !== "object") return old;
  const o = old as Record<string, unknown>;

  // Single-page "jobs" query: { jobs: BackendJob[], pagination }
  if (Array.isArray(o.jobs)) {
    return {
      ...o,
      jobs: (o.jobs as { id: string; is_saved?: boolean }[]).map(job => (job.id === jobId ? { ...job, is_saved: saved } : job)),
    };
  }

  // Infinite "searchJobs" query: { pages: JobListResponse[], pageParams }
  if (Array.isArray(o.pages)) {
    return {
      ...o,
      pages: (o.pages as JobListResponse[]).map(page => ({
        ...page,
        jobs: page.jobs?.map(job => (job.id === jobId ? { ...job, is_saved: saved } : job)) ?? [],
      })),
    };
  }

  return old;
}

export function useSaveJob(options: UseJobMutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, jobTitle }: MutationArgs) => {
      const result = await saveJob(jobId);
      return { jobId, jobTitle, result };
    },
    onSuccess: ({ jobId }) => {
      // Update all "jobs" caches in place (recommended, etc.) so button reflects saved without refetch
      queryClient.setQueriesData({ queryKey: ["jobs"] }, old => updateJobsCache(jobId, true, old));
      queryClient.setQueriesData({ queryKey: ["searchJobs"] }, old => updateJobsCache(jobId, true, old));
      queryClient.setQueriesData({ queryKey: ["recommendedJobs"] }, old => updateJobsCache(jobId, true, old));
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      options.onSuccess?.(jobId, true);
    },
    onError: error => {
      options.onError?.(error);
    },
  });
}

export function useUnsaveJob(options: UseJobMutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, jobTitle }: MutationArgs) => {
      const result = await unsaveJob(jobId);
      return { jobId, jobTitle, result };
    },
    onSuccess: ({ jobId }) => {
      queryClient.setQueriesData({ queryKey: ["jobs"] }, old => updateJobsCache(jobId, false, old));
      queryClient.setQueriesData({ queryKey: ["searchJobs"] }, old => updateJobsCache(jobId, false, old));
      queryClient.setQueriesData({ queryKey: ["recommendedJobs"] }, old => updateJobsCache(jobId, false, old));
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      options.onSuccess?.(jobId, false);
    },
    onError: error => {
      options.onError?.(error);
    },
  });
}
