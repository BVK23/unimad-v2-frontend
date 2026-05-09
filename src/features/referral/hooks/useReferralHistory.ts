import { useQuery } from "@tanstack/react-query";
import { fetchReferrals } from "../server-actions/referral-actions";

export const REFERRAL_LIST_QUERY_KEY = ["referrals"] as const;

export function useReferralHistory() {
  return useQuery({
    queryKey: REFERRAL_LIST_QUERY_KEY,
    queryFn: () => fetchReferrals(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
