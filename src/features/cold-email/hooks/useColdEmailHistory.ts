import { useQuery } from "@tanstack/react-query";
import { fetchColdEmails } from "../server-actions/cold-email-actions";

export const COLD_EMAIL_LIST_QUERY_KEY = ["cold-emails"] as const;

export function useColdEmailHistory() {
  return useQuery({
    queryKey: COLD_EMAIL_LIST_QUERY_KEY,
    queryFn: () => fetchColdEmails(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
