import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AtsScoreMeta, AtsScoreViewModel } from "../api/ats-types";
import { mapAtsScoreToViewModel } from "../api/mapAtsScoreToViewModel";
import { calculateResumeAtsScore } from "../server-actions/resume-actions";
import { resumeAtsQueryKey } from "./useResumeAtsScore";

export type AtsScoreMutationResult = AtsScoreViewModel & AtsScoreMeta;

export function useCalculateAtsScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeId, force = false }: { resumeId: string; force?: boolean }): Promise<AtsScoreMutationResult> => {
      const result = await calculateResumeAtsScore(resumeId, { force });
      if (!result.ok) {
        const err = new Error(result.error) as Error & { code?: string; status?: number };
        err.code = result.code;
        err.status = result.status;
        throw err;
      }
      const vm = mapAtsScoreToViewModel(result.ats_score);
      return {
        ...vm,
        ats_calc_count: result.ats_calc_count,
        from_cache: result.from_cache,
        scored_at: result.scored_at,
        resume_updated_at: result.resume_updated_at,
        score_stale: result.score_stale,
      };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: resumeAtsQueryKey(variables.resumeId) });
    },
  });
}
