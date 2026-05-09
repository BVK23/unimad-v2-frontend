import { useQuery } from "@tanstack/react-query";
import { getJobs } from "../server-actions/jobs-actions";

export interface LocationSuggestionsContext {
  recommended?: boolean;
  q?: string;
}

const LOCATIONS_MAX = 30;
const LOCATIONS_DISPLAY = 15;

export function useLocationSuggestions(context: LocationSuggestionsContext = {}, locationInputValue: string = "") {
  const trimmed = (locationInputValue ?? "").trim();
  const enabled = trimmed.length >= 1;

  const params = context.recommended
    ? { recommended: 1, page_size: 50 }
    : context.q?.trim()
      ? { q: context.q.trim(), page_size: 50 }
      : { page_size: 50 };

  const { data, isLoading, error } = useQuery({
    queryKey: ["locationSuggestions", params],
    queryFn: async () => getJobs(params),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const allJobs = [...(data?.jobs ?? []), ...(data?.jobs_for_experience ?? [])];
  const allLocations = allJobs.length ? [...new Set(allJobs.map(job => job.location).filter(Boolean))].slice(0, LOCATIONS_MAX) : [];

  const locations = trimmed
    ? allLocations.filter(loc => loc!.toLowerCase().includes(trimmed.toLowerCase())).slice(0, LOCATIONS_DISPLAY)
    : allLocations.slice(0, LOCATIONS_DISPLAY);

  return {
    locations: locations as string[],
    isLoading: enabled && isLoading,
    error,
  };
}
