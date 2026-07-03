import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchColdEmails } from "../server-actions/cold-email-actions";

export const COLD_EMAIL_LIST_QUERY_KEY = ["cold-emails"] as const;

export function coldEmailListQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(COLD_EMAIL_LIST_QUERY_KEY, session);
}

export function useColdEmailHistory() {
  const actAs = useCoachActAsSession();
  return useQuery({
    queryKey: coldEmailListQueryKeyFor(actAs),
    queryFn: () => fetchColdEmails(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
