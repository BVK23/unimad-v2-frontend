import { useQuery } from "@tanstack/react-query";
import { fetchReferralById } from "../server-actions/referral-actions";
import type { ReferralAsset } from "../types";

export function useReferral(id: string | number | undefined | null) {
  return useQuery({
    queryKey: ["referral", id],
    queryFn: async (): Promise<ReferralAsset | null> => {
      if (id == null) return null;
      return fetchReferralById(id);
    },
    enabled: id != null && id !== "",
    staleTime: 2 * 60 * 1000,
  });
}
