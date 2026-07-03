import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchReferrals } from "../server-actions/referral-actions";

export const REFERRAL_LIST_QUERY_KEY = ["referrals"] as const;

export function referralListQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(REFERRAL_LIST_QUERY_KEY, session);
}

export function useReferralHistory() {
  const actAs = useCoachActAsSession();
  return useQuery({
    queryKey: referralListQueryKeyFor(actAs),
    queryFn: () => fetchReferrals(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
