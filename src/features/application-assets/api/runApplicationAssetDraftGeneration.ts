import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { runAdkApplicationAssetStudioDraft } from "@/features/application-assets/api/runAdkApplicationAssetStudioDraft";
import { USE_ADK_APPLICATION_ASSETS } from "@/features/application-assets/config";
import { generateApplicationAssetDraft } from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

export type RunApplicationAssetDraftParams = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  applicationId?: string | number;
};

export type RunApplicationAssetDraftResult = {
  draft: string;
  assetId?: string;
};

const syncStudioPreviewOnly = (
  params: RunApplicationAssetDraftParams,
  draft: string,
  meta: { role: string; company: string; jobDescription: string; contactName: string }
) => {
  useApplicationAssetStudioStore.getState().syncFromStudio({
    assetType: params.assetType,
    assetId: null,
    role: meta.role,
    company: meta.company,
    jobDescription: meta.jobDescription,
    contactName: meta.contactName,
    draftPreview: draft,
    acceptedContent: "",
  });

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.applyContext, {
      detail: {
        assetType: params.assetType,
        role: meta.role,
        company: meta.company,
        jobDescription: meta.jobDescription,
        contactName: meta.contactName || undefined,
        assetId: null,
      },
    })
  );

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.draftPreview, {
      detail: {
        draft,
        assetType: params.assetType,
        role: meta.role,
        company: meta.company,
        jobDescription: meta.jobDescription,
        contactName: meta.contactName || undefined,
      },
    })
  );

  window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
};

const runDjangoApplicationAssetDraft = async (params: RunApplicationAssetDraftParams): Promise<RunApplicationAssetDraftResult> => {
  const body = {
    type: params.assetType,
    role: params.role,
    company: params.company,
    job_description: params.jobDescription,
    application_id: params.applicationId,
    ...(params.assetType === "coldemail" && params.contactName ? { hirname: params.contactName } : {}),
    ...(params.assetType === "referral" && params.contactName ? { conname: params.contactName } : {}),
  };

  const result = await generateApplicationAssetDraft(body);
  const draft = result.content?.trim() ?? "";

  if (!draft) {
    throw new Error("Could not read the generated draft. Please try again.");
  }

  const contactName = result.contact_name ?? params.contactName ?? "";
  syncStudioPreviewOnly(params, draft, {
    role: result.role || params.role,
    company: result.company || params.company,
    jobDescription: result.job_description ?? params.jobDescription,
    contactName,
  });

  return { draft };
};

/**
 * Studio form / Prepare modal: ADK headless generation (default) or Django Unibot fallback.
 * ADK path persists to DB immediately; Django path keeps preview-only until Accept.
 */
export const runApplicationAssetDraftGeneration = async (
  params: RunApplicationAssetDraftParams
): Promise<RunApplicationAssetDraftResult> => {
  if (USE_ADK_APPLICATION_ASSETS) {
    return runAdkApplicationAssetStudioDraft(params);
  }
  return runDjangoApplicationAssetDraft(params);
};
