"use client";

import { runApplicationAssetDraftGeneration } from "@/features/application-assets/api/runApplicationAssetDraftGeneration";
import {
  prependApplicationAssetToListCache,
  refetchApplicationAssetList,
} from "@/features/application-assets/api/updateApplicationAssetListCache";
import { checkApplicationAssetAvailability } from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { STUDIO_TOPIC_TO_API_TYPE, type ApplicationAssetStudioTopic } from "@/features/application-assets/types";
import { ADK_DRAFT_PENDING_ERROR } from "@/features/content-lab/hooks/runContentGenDraftGeneration";
import { sanitizeUserFacingError } from "@/utils/message-from-failed-response";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type GenerateApplicationAssetParams = {
  studioTopic: ApplicationAssetStudioTopic;

  role: string;

  company: string;

  job_description?: string;

  hirname?: string;

  conname?: string;

  application_id?: string | number;
};

export type RegenerateApplicationAssetParams = Omit<GenerateApplicationAssetParams, "studioTopic"> & {
  studioAssetId: string;
};

export type GenerateApplicationAssetResult =
  | {
      success: true;

      assetType: ApplicationAssetApiType;

      role: string;

      company: string;

      job_description?: string;

      contactName?: string;

      content: string;
      assetId?: string;
    }
  | { duplicate: true; existing_asset_id: string | number }
  | { subscriptionRequired: true }
  | { error: string };

/** Generate Another: new ADK draft for an existing asset — skips duplicate check, keeps Studio preview until Accept. */
export const regenerateApplicationAssetDraft = async (
  params: RegenerateApplicationAssetParams & { studioTopic: ApplicationAssetStudioTopic }
): Promise<GenerateApplicationAssetResult> => {
  const assetType = STUDIO_TOPIC_TO_API_TYPE[params.studioTopic];
  const contactName = params.hirname ?? params.conname ?? "";
  const studioAssetId = params.studioAssetId.trim();

  const store = useApplicationAssetStudioStore.getState();
  store.syncFromStudio({
    assetType,
    assetId: studioAssetId,
    applicationId: params.application_id != null ? String(params.application_id) : null,
    role: params.role,
    company: params.company,
    jobDescription: params.job_description ?? "",
    contactName,
  });
  store.setRegenerateAnotherInFlight(true);

  try {
    await runApplicationAssetDraftGeneration({
      assetType,
      role: params.role,
      company: params.company,
      jobDescription: params.job_description ?? "",
      contactName,
      applicationId: params.application_id,
      studioAssetId,
      preserveExistingDraft: true,
      regenerateAnother: true,
    });
    return {
      success: true,
      assetType,
      role: params.role,
      company: params.company,
      job_description: params.job_description,
      contactName,
      content: "",
      assetId: studioAssetId,
    };
  } catch (err) {
    store.setRegenerateAnotherInFlight(false);
    if (err instanceof Error && err.message === ADK_DRAFT_PENDING_ERROR) {
      throw err;
    }

    const rawMessage = err instanceof Error ? err.message : "Draft generation failed. Please try again.";
    const message = sanitizeUserFacingError(rawMessage, "Draft generation failed. Please try again.");

    if (rawMessage.toLowerCase().includes("plus membership") || message.toLowerCase().includes("plus membership")) {
      return { subscriptionRequired: true };
    }

    return { error: message };
  }
};

export const useGenerateApplicationAsset = (options?: {
  onSuccess?: (result: GenerateApplicationAssetResult) => void;

  onError?: (message: string) => void;

  onSettled?: () => void;
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: GenerateApplicationAssetParams): Promise<GenerateApplicationAssetResult> => {
      const assetType = STUDIO_TOPIC_TO_API_TYPE[params.studioTopic];

      const checkParams = {
        type: assetType,

        role: params.role,

        company: params.company,

        job_description: params.job_description,

        application_id: params.application_id,

        hirname: params.hirname,

        conname: params.conname,
      };

      const result = await checkApplicationAssetAvailability(checkParams);

      if ("error_code" in result && result.error_code === "NOT_A_PLUS_MEMBER") {
        return { subscriptionRequired: true };
      }

      if ("error" in result && result.error?.data?.existing_asset_id != null) {
        return {
          duplicate: true,

          existing_asset_id: result.error.data.existing_asset_id,
        };
      }

      const contactName = params.hirname ?? params.conname ?? "";

      useApplicationAssetStudioStore.getState().syncFromStudio({
        assetType,

        assetId: null,

        role: params.role,

        company: params.company,

        jobDescription: params.job_description ?? "",

        contactName,

        draftPreview: "",

        acceptedContent: "",
      });

      try {
        const result = await runApplicationAssetDraftGeneration({
          assetType,

          role: params.role,

          company: params.company,

          jobDescription: params.job_description ?? "",

          contactName,

          applicationId: params.application_id,
        });

        return {
          success: true,

          assetType,

          role: params.role,

          company: params.company,

          job_description: params.job_description,

          contactName,

          content: result.draft,
          assetId: result.assetId,
        };
      } catch (err) {
        if (err instanceof Error && err.message === ADK_DRAFT_PENDING_ERROR) {
          throw err;
        }

        const rawMessage = err instanceof Error ? err.message : "Draft generation failed. Please try again.";
        const message = sanitizeUserFacingError(rawMessage, "Draft generation failed. Please try again.");

        if (rawMessage.toLowerCase().includes("plus membership") || message.toLowerCase().includes("plus membership")) {
          return { subscriptionRequired: true };
        }

        return { error: message };
      }
    },

    onSuccess: async result => {
      if ("success" in result && result.success) {
        const now = new Date().toISOString();
        if (result.assetId) {
          const base = {
            id: result.assetId,
            role: result.role,
            company: result.company,
            job_description: result.job_description,
            content: result.content,
            status: "accepted" as const,
            updated_at: now,
            created_at: now,
          };
          if (result.assetType === "coverletter") {
            prependApplicationAssetToListCache(queryClient, result.assetType, base);
          } else if (result.assetType === "coldemail") {
            prependApplicationAssetToListCache(queryClient, result.assetType, {
              ...base,
              hirname: result.contactName ?? "",
            });
          } else {
            prependApplicationAssetToListCache(queryClient, result.assetType, {
              ...base,
              conname: result.contactName ?? "",
            });
          }
        }
        void refetchApplicationAssetList(queryClient, result.assetType);
      }

      options?.onSuccess?.(result);
    },

    onError: (err: Error) => {
      if (err.message === ADK_DRAFT_PENDING_ERROR) {
        return;
      }
      options?.onError?.(sanitizeUserFacingError(err.message, "Draft generation failed. Please try again."));
    },

    onSettled: () => {
      options?.onSettled?.();
    },
  });

  return mutation;
};
