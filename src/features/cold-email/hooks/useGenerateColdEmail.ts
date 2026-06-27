import {
  useGenerateApplicationAsset,
  regenerateApplicationAssetDraft,
  type GenerateApplicationAssetResult,
  type RegenerateApplicationAssetParams,
} from "@/features/application-assets/hooks/useGenerateApplicationAsset";
import { deleteColdEmail } from "../server-actions/cold-email-actions";
import type { GenerateColdEmailParams } from "../types";

export type GenerateColdEmailResult = GenerateApplicationAssetResult;

export function useGenerateColdEmail(options?: {
  onSuccess?: (result: GenerateColdEmailResult) => void;
  onError?: (message: string) => void;
  onSettled?: () => void;
}) {
  const mutation = useGenerateApplicationAsset(options);

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateColdEmailParams
  ): Promise<GenerateColdEmailResult> => {
    await deleteColdEmail(existingId);
    return mutation.mutateAsync({
      studioTopic: "cold-email",
      role: params.role,
      company: params.company,
      job_description: params.job_description,
      hirname: params.hirname,
      application_id: params.application_id,
    });
  };

  return {
    ...mutation,
    mutate: (params: GenerateColdEmailParams, mutateOptions?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(
        {
          studioTopic: "cold-email",
          role: params.role,
          company: params.company,
          job_description: params.job_description,
          hirname: params.hirname,
          application_id: params.application_id,
        },
        mutateOptions
      ),
    mutateAsync: (params: GenerateColdEmailParams) =>
      mutation.mutateAsync({
        studioTopic: "cold-email",
        role: params.role,
        company: params.company,
        job_description: params.job_description,
        hirname: params.hirname,
        application_id: params.application_id,
      }),
    replaceExistingAndGenerate,
    regenerateAnother: (params: RegenerateApplicationAssetParams) =>
      regenerateApplicationAssetDraft({ ...params, studioTopic: "cold-email" }),
  };
}
