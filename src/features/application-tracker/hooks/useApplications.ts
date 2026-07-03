import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "../server-actions/application-actions";

export const applicationsQueryKey = ["applications"] as const;

export function applicationsQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(applicationsQueryKey, session);
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
