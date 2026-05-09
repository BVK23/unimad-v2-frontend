import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../server-actions/jobs-actions";

const SUGGESTIONS_MIN_LENGTH = 2;
const MAX_SUGGESTIONS = 8;

export function useJobSuggestions(query: string) {
  const trimmed = (query ?? "").trim();
  const enabled = trimmed.length >= SUGGESTIONS_MIN_LENGTH;

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobSuggestions", trimmed],
    queryFn: async () => getJobs({ q: trimmed, page_size: 20 }),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const suggestions = enabled && data?.jobs ? [...new Set(data.jobs.map(job => job.title))].slice(0, MAX_SUGGESTIONS) : [];

  return {
    suggestions,
    isLoading: enabled && isLoading,
    error,
  };
}
