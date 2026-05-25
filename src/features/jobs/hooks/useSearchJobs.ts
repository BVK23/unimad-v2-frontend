import { useInfiniteQuery } from "@tanstack/react-query";
import { activeFiltersToSearchParams } from "../job-search-filters";
import { getJobs } from "../server-actions/jobs-actions";
import type { JobListResponse, JobSearchParams } from "../types";

const SEARCH_PAGE_SIZE = 20;

export interface UseSearchJobsParams {
  q: string;
  location?: string;
  activeFilters?: string[];
}

export function useSearchJobs(params: UseSearchJobsParams | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const effectiveEnabled = !!params?.q?.trim() && enabled;
  const filterKey = (params?.activeFilters ?? []).slice().sort().join("|");

  const query = useInfiniteQuery<JobListResponse>({
    queryKey: ["searchJobs", params?.q ?? "", params?.location ?? "", filterKey],
    queryFn: async ({ pageParam }) => {
      const p: JobSearchParams = {
        q: params!.q.trim(),
        page: pageParam as number,
        page_size: SEARCH_PAGE_SIZE,
        ...activeFiltersToSearchParams(params!.activeFilters ?? []),
      };
      if (params!.location?.trim()) p.location = params!.location.trim();
      return getJobs(p);
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (!lastPage.pagination?.has_next) return undefined;
      return lastPage.pagination.page + 1;
    },
    enabled: effectiveEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const flattenedJobs = query.data?.pages?.flatMap(page => page.jobs ?? []) ?? [];
  const hasNextPage = query.hasNextPage ?? false;
  const isFetchingNextPage = query.isFetchingNextPage;

  return {
    ...query,
    flattenedJobs,
    hasNextPage,
    isFetchingNextPage,
  };
}
