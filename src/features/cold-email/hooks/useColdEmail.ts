import { useQuery } from "@tanstack/react-query";
import { fetchColdEmailById } from "../server-actions/cold-email-actions";
import type { ColdEmailAsset } from "../types";

export function useColdEmail(id: string | number | undefined | null) {
  return useQuery({
    queryKey: ["cold-email", id],
    queryFn: async (): Promise<ColdEmailAsset | null> => {
      if (id == null) return null;
      return fetchColdEmailById(id);
    },
    enabled: id != null && id !== "",
    staleTime: 2 * 60 * 1000,
  });
}
