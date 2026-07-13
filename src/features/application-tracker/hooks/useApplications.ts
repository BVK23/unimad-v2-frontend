import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchApplications } from "../server-actions/application-actions";
import type { Application } from "../types";

export const applicationsQueryKey = ["applications"] as const;

export function applicationsQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(applicationsQueryKey, session);
}

/**
 * Read applications from any scoped cache entry (`["applications","self"]`, coach act-as, etc.).
 * Exact `getQueryData(["applications"])` misses the real key and returns [].
 */
export function getApplicationsFromQueryClient(queryClient: QueryClient): Application[] {
  const entries = queryClient.getQueriesData<Application[]>({ queryKey: applicationsQueryKey });
  let empty: Application[] | null = null;
  for (const [, data] of entries) {
    if (!Array.isArray(data)) continue;
    if (data.length > 0) return data;
    empty = data;
  }
  return empty ?? [];
}

export function useApplications() {
  const actAs = useCoachActAsSession();
  return useQuery({
    queryKey: applicationsQueryKeyFor(actAs),
    queryFn: async () => fetchApplications(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
