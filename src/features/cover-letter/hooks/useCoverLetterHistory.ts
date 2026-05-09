import { useQuery } from "@tanstack/react-query";
import { fetchCoverLetters } from "../server-actions/cover-letter-actions";

export const COVER_LETTER_LIST_QUERY_KEY = ["cover-letters"] as const;

export function useCoverLetterHistory() {
  return useQuery({
    queryKey: COVER_LETTER_LIST_QUERY_KEY,
    queryFn: () => fetchCoverLetters(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
