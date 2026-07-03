import { useCoachActAsSession, withCoachActAsScope } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchCoverLetters } from "../server-actions/cover-letter-actions";

export const COVER_LETTER_LIST_QUERY_KEY = ["cover-letters"] as const;

export function coverLetterListQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return withCoachActAsScope(COVER_LETTER_LIST_QUERY_KEY, session);
}

export function useCoverLetterHistory() {
  const actAs = useCoachActAsSession();
  return useQuery({
    queryKey: coverLetterListQueryKeyFor(actAs),
    queryFn: () => fetchCoverLetters(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
}
