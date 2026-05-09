import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ResumeData } from "../../../../types";
import { mapBackendResumeToFrontend } from "../api/mappers";
import { fetchResumeContent } from "../server-actions/resume-actions";
import { useResumeStore } from "../store/useResumeStore";
import { getResumeContentSignature } from "../utils/getResumeContentSignature";

/** Matches `useResume` detail query key for a persisted resume id (use with setQueryData / prefetch). */
export const resumeByIdQueryKey = (id: string) => ["resumes", id] as const;

export function useResume(resumeId: string | undefined) {
  const lastHydratedSnapshotRef = useRef<string>("");

  const query = useQuery({
    queryKey: ["resumes", resumeId],
    queryFn: async () => {
      if (!resumeId) throw new Error("No resume ID provided");

      const response = await fetchResumeContent(resumeId);

      if (!response.resumeData) {
        throw new Error("Resume not found");
      }

      return mapBackendResumeToFrontend(response.resumeData);
    },
    // Don't fetch if resumeId is missing
    enabled: !!resumeId,
    // Slightly shorter stale time for individual edits
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Hydrate zustand store when data changes
  useEffect(() => {
    if (!query.data || !resumeId) return;

    const nextSnapshot = `${resumeId}:${getResumeContentSignature(query.data)}`;
    if (lastHydratedSnapshotRef.current === nextSnapshot) return;

    const current = useResumeStore.getState().getResumeData(resumeId);
    if (current && getResumeContentSignature(current) === getResumeContentSignature(query.data)) {
      lastHydratedSnapshotRef.current = nextSnapshot;
      return;
    }

    useResumeStore.getState().setResumeData(resumeId, query.data);
    lastHydratedSnapshotRef.current = nextSnapshot;
  }, [query.data, resumeId]);

  return query;
}
