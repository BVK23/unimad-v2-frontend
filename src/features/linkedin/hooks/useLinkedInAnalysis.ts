import { analyzeLinkedInProfile, fetchLinkedInAnalysis } from "@/features/linkedin/server-actions/linkedin-analyzer-actions";
import type { LinkedInAnalysisSnapshot } from "@/features/linkedin/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const linkedinAnalysisQueryKey = ["linkedin-analysis"] as const;

export const useLinkedInAnalysis = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: linkedinAnalysisQueryKey,
    queryFn: (): Promise<LinkedInAnalysisSnapshot | null> => fetchLinkedInAnalysis(),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
};

export const useAnalyzeLinkedInProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: analyzeLinkedInProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkedinAnalysisQueryKey });
    },
  });
};
