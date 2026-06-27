import {
  useGenerateApplicationAsset,
  regenerateApplicationAssetDraft,
  type GenerateApplicationAssetResult,
  type RegenerateApplicationAssetParams,
} from "@/features/application-assets/hooks/useGenerateApplicationAsset";
import { deleteReferral } from "../server-actions/referral-actions";
import type { GenerateReferralParams } from "../types";

export type GenerateReferralResult = GenerateApplicationAssetResult;

export function useGenerateReferral(options?: {
  onSuccess?: (result: GenerateReferralResult) => void;
  onError?: (message: string) => void;
  onSettled?: () => void;
}) {
  const mutation = useGenerateApplicationAsset(options);

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateReferralParams
  ): Promise<GenerateReferralResult> => {
    await deleteReferral(existingId);
    return mutation.mutateAsync({
      studioTopic: "referral",
      role: params.role,
      company: params.company,
      conname: params.conname,
      application_id: params.application_id,
    });
  };

  return {
    ...mutation,
    mutate: (params: GenerateReferralParams, mutateOptions?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(
        {
          studioTopic: "referral",
          role: params.role,
          company: params.company,
          conname: params.conname,
          application_id: params.application_id,
        },
        mutateOptions
      ),
    mutateAsync: (params: GenerateReferralParams) =>
      mutation.mutateAsync({
        studioTopic: "referral",
        role: params.role,
        company: params.company,
        conname: params.conname,
        application_id: params.application_id,
      }),
    replaceExistingAndGenerate,
    regenerateAnother: (params: RegenerateApplicationAssetParams) =>
      regenerateApplicationAssetDraft({ ...params, studioTopic: "referral" }),
  };
}
