import { analyzeLinkedInProfile, fetchLinkedInAnalysis } from "@/features/linkedin/server-actions/linkedin-analyzer-actions";
import type { LinkedInAnalysisSnapshot, LinkedInAnalyzeResult } from "@/features/linkedin/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const linkedinAnalysisQueryKey = ["linkedin-analysis"] as const;

export class LinkedInAnalyzerClientError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "LinkedInAnalyzerClientError";
    this.code = code;
  }
}

export const useLinkedInAnalysis = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: linkedinAnalysisQueryKey,
    queryFn: async (): Promise<LinkedInAnalysisSnapshot | null> => {
      const result = await fetchLinkedInAnalysis();
      if (!result.success) {
        throw new LinkedInAnalyzerClientError(result.error, result.code);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
};

export const useAnalyzeLinkedInProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<LinkedInAnalyzeResult> => {
      const result = await analyzeLinkedInProfile();
      if (!result.success) {
        throw new LinkedInAnalyzerClientError(result.error, result.code);
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: linkedinAnalysisQueryKey });
    },
  });
};
