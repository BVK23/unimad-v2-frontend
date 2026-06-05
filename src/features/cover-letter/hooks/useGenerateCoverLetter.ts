import {
  useGenerateApplicationAsset,
  type GenerateApplicationAssetResult,
} from "@/features/application-assets/hooks/useGenerateApplicationAsset";
import { deleteCoverLetter } from "../server-actions/cover-letter-actions";
import type { GenerateCoverLetterParams } from "../types";

export type GenerateCoverLetterResult = GenerateApplicationAssetResult;

export function useGenerateCoverLetter(options?: {
  onSuccess?: (result: GenerateCoverLetterResult) => void;
  onError?: (message: string) => void;
  onSettled?: () => void;
}) {
  const mutation = useGenerateApplicationAsset(options);

  const replaceExistingAndGenerate = async (
    existingId: string | number,
    params: GenerateCoverLetterParams
  ): Promise<GenerateCoverLetterResult> => {
    await deleteCoverLetter(existingId);
    return mutation.mutateAsync({
      studioTopic: "cover-letter",
      role: params.role,
      company: params.company,
      job_description: params.job_description,
      application_id: params.application_id,
    });
  };

  return {
    ...mutation,
    mutate: (params: GenerateCoverLetterParams, mutateOptions?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(
        {
          studioTopic: "cover-letter",
          role: params.role,
          company: params.company,
          job_description: params.job_description,
          application_id: params.application_id,
        },
        mutateOptions
      ),
    mutateAsync: (params: GenerateCoverLetterParams) =>
      mutation.mutateAsync({
        studioTopic: "cover-letter",
        role: params.role,
        company: params.company,
        job_description: params.job_description,
        application_id: params.application_id,
      }),
    replaceExistingAndGenerate,
  };
}
