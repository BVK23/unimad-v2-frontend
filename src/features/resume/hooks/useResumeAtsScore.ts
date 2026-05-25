import { fetchResumeAtsScore } from "@/features/resume/server-actions/resume-actions";
import { useQuery } from "@tanstack/react-query";

export const resumeAtsQueryKey = (resumeId: string) => ["resume-ats", resumeId] as const;

export function useResumeAtsScore(resumeId: string, enabled = true) {
  return useQuery({
    queryKey: resumeAtsQueryKey(resumeId),
    queryFn: () => fetchResumeAtsScore(resumeId),
    enabled: enabled && Boolean(resumeId?.trim()),
    staleTime: 1000 * 60 * 2,
  });
}
