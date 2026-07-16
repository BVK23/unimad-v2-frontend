import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchVpdLanding } from "../server-actions/vpd-actions";

export const VPD_LIST_QUERY_KEY = ["vpds"] as const;

export function vpdListQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(VPD_LIST_QUERY_KEY, session);
}

export function useVpdHistory(enabled = true) {
  const actAs = useCoachActAsSession();
  return useQuery({
    queryKey: vpdListQueryKeyFor(actAs),
    queryFn: () => fetchVpdLanding(),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
