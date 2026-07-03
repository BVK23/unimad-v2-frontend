import { useEffect } from "react";
import { coachActAsQueryScope, useCoachActAsSession } from "@/contexts/CoachActAsContext";
import { useQuery } from "@tanstack/react-query";
import type { ResumeData } from "../../../../types";
import { mapBackendResumeToFrontend } from "../api/mappers";
import { fetchUserResumes } from "../server-actions/resume-actions";
import { useResumeStore } from "../store/useResumeStore";

export const resumesListQueryKey = ["resumes"] as const;

export function resumesListQueryKeyFor(session: ReturnType<typeof useCoachActAsSession>) {
  return [...resumesListQueryKey, ...coachActAsQueryScope(session)] as const;
}

export function useResumesList() {
  const actAs = useCoachActAsSession();
  const query = useQuery({
    queryKey: resumesListQueryKeyFor(actAs),
    queryFn: async () => {
      const response = await fetchUserResumes();

      if (!response.assetData || !Array.isArray(response.assetData)) {
        return [];
      }

      // Map backend data to frontend ResumeData format
      return response.assetData.map(dto => mapBackendResumeToFrontend(dto as Record<string, unknown>));
    },
    // Prevent aggressive refetching since resumes don't change often outside user action
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Hydrate zustand store when data changes
  useEffect(() => {
    if (query.data) {
      useResumeStore.getState().setAllResumes(query.data);
    }
  }, [query.data]);

  return query;
}
