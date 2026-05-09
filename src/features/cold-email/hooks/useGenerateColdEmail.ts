import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateColdEmail, deleteColdEmail, fetchColdEmailWithContent } from "../server-actions/cold-email-actions";
import type { GenerateColdEmailParams } from "../types";
import { COLD_EMAIL_LIST_QUERY_KEY } from "./useColdEmailHistory";

export type GenerateColdEmailResult =
  | {
      success: true;
      id: string | number;
      content: string;
      role: string;
      company: string;
      job_description?: string;
      hirname?: string;
    }
  | { duplicate: true; existing_asset_id: string | number }
  | { subscriptionRequired: true }
  | { error: string };

export function useGenerateColdEmail(options?: {
  onSuccess?: (result: GenerateColdEmailResult) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: GenerateColdEmailParams): Promise<GenerateColdEmailResult> => {
      const result = await generateColdEmail(params);
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
        const full = await fetchColdEmailWithContent(result.id);
        const content = full?.content ?? "";
        return {
          success: true,
          id: result.id,
          content,
          role: params.role,
          company: params.company,
          job_description: params.job_description,
          hirname: params.hirname,
        };
      }
      return { error: "Failed to generate cold email" };
    },
    onSuccess: result => {
      if ("success" in result && result.success) {
        queryClient.invalidateQueries({ queryKey: COLD_EMAIL_LIST_QUERY_KEY });
      }
      options?.onSuccess?.(result);
    },
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateColdEmailParams
  ): Promise<GenerateColdEmailResult> => {
    await deleteColdEmail(existingId);
    const result = await mutation.mutateAsync(params);
    return result;
  };

  return { ...mutation, replaceExistingAndGenerate };
}
