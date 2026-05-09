import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateReferral, deleteReferral, fetchReferralWithContent } from "../server-actions/referral-actions";
import type { GenerateReferralParams } from "../types";
import { REFERRAL_LIST_QUERY_KEY } from "./useReferralHistory";

export type GenerateReferralResult =
  | {
      success: true;
      id: string | number;
      content: string;
      role: string;
      company: string;
      conname?: string;
    }
  | { duplicate: true; existing_asset_id: string | number }
  | { subscriptionRequired: true }
  | { error: string };

export function useGenerateReferral(options?: {
  onSuccess?: (result: GenerateReferralResult) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: GenerateReferralParams): Promise<GenerateReferralResult> => {
      const result = await generateReferral(params);
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
        const full = await fetchReferralWithContent(result.id);
        const content = full?.content ?? "";
        return {
          success: true,
          id: result.id,
          content,
          role: params.role,
          company: params.company,
          conname: params.conname,
        };
      }
      return { error: "Failed to generate referral" };
    },
    onSuccess: result => {
      if ("success" in result && result.success) {
        queryClient.invalidateQueries({ queryKey: REFERRAL_LIST_QUERY_KEY });
      }
      options?.onSuccess?.(result);
    },
    onError: (err: Error) => {
      options?.onError?.(err.message);
    },
  });

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateReferralParams
  ): Promise<GenerateReferralResult> => {
    await deleteReferral(existingId);
    const result = await mutation.mutateAsync(params);
    return result;
  };

  return { ...mutation, replaceExistingAndGenerate };
}
