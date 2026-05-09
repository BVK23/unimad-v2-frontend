import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateCoverLetter, deleteCoverLetter, fetchCoverLetterWithContent } from "../server-actions/cover-letter-actions";
import type { GenerateCoverLetterParams } from "../types";
import { COVER_LETTER_LIST_QUERY_KEY } from "./useCoverLetterHistory";

export type GenerateCoverLetterResult =
  | { success: true; id: string | number; content: string; role: string; company: string; job_description?: string }
  | { duplicate: true; existing_asset_id: string | number }
  | { subscriptionRequired: true }
  | { error: string };

export function useGenerateCoverLetter(options?: {
  onSuccess?: (result: GenerateCoverLetterResult) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: GenerateCoverLetterParams): Promise<GenerateCoverLetterResult> => {
      const result = await generateCoverLetter(params);
      if ("error_code" in result && result.error_code === "NOT_A_PLUS_MEMBER") {
        return { subscriptionRequired: true };
      }
      if ("error" in result && result.error?.data?.existing_asset_id != null) {
        return {
          duplicate: true,
          existing_asset_id: result.error.data.existing_asset_id,
        };
      }
      if ("id" in result) {
        const full = await fetchCoverLetterWithContent(result.id);
        const content = full?.content ?? "";
        return {
          success: true,
          id: result.id,
          content,
          role: params.role,
          company: params.company,
          job_description: params.job_description,
        };
      }
      return { error: "Failed to generate cover letter" };
    },
    onSuccess: result => {
      if ("success" in result && result.success) {
        queryClient.invalidateQueries({ queryKey: COVER_LETTER_LIST_QUERY_KEY });
      }
      options?.onSuccess?.(result);
    },
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateCoverLetterParams
  ): Promise<GenerateCoverLetterResult> => {
    await deleteCoverLetter(existingId);
    const result = await mutation.mutateAsync(params);
    return result;
  };

  return { ...mutation, replaceExistingAndGenerate };
}
