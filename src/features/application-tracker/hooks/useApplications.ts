import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "../server-actions/application-actions";

export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => fetchApplications(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
