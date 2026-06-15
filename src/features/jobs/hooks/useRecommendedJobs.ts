import { useInfiniteQuery } from "@tanstack/react-query";
import { getJobs } from "../server-actions/jobs-actions";
import type { JobListResponse } from "../types";

const RECOMMENDED_PAGE_SIZE = 20;

export function useRecommendedJobs(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const query = useInfiniteQuery<JobListResponse>({
    queryKey: ["recommendedJobs"],
    queryFn: async ({ pageParam }) => {
      return getJobs({
        recommended: 1,
        page: pageParam as number,
        page_size: RECOMMENDED_PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (!lastPage.pagination?.has_next) return undefined;
      return lastPage.pagination.page + 1;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const flattenedJobs = query.data?.pages?.flatMap(page => page.jobs ?? []) ?? [];
  const hasNextPage = query.hasNextPage ?? false;
  const isFetchingNextPage = query.isFetchingNextPage;
  const recommendedContext = query.data?.pages?.[0]?.recommended_context;

  return {
    ...query,
    flattenedJobs,
    hasNextPage,
    isFetchingNextPage,
    recommendedContext,
  };
}
