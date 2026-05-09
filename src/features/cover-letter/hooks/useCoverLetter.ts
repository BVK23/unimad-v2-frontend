import { useQuery } from "@tanstack/react-query";
import { fetchCoverLetterById } from "../server-actions/cover-letter-actions";
import type { CoverLetterAsset } from "../types";

export function useCoverLetter(id: string | number | undefined | null) {
  return useQuery({
    queryKey: ["cover-letter", id],
    queryFn: async (): Promise<CoverLetterAsset | null> => {
      if (id == null) return null;
      return fetchCoverLetterById(id);
    },
    enabled: id != null && id !== "",
    staleTime: 2 * 60 * 1000,
  });
}
