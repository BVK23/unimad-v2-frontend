import { APPLICATION_ASSET_EVENTS, type ApplicationAssetOpenDraftDetail } from "@/features/application-assets/api/application-asset-events";
import { USE_ADK_APPLICATION_ASSETS } from "@/features/application-assets/config";
import { generateApplicationAssetDraft } from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { createDraftGenerationTimer } from "@/features/application-assets/utils/draftGenerationTimer";
import { ADK_DRAFT_PENDING_ERROR } from "@/features/content-lab/hooks/runContentGenDraftGeneration";

export type RunApplicationAssetDraftParams = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  applicationId?: string | number;
  /** Existing Django asset id — sub-thread key and accept target. */
  studioAssetId?: string | null;
  preserveExistingDraft?: boolean;
  regenerateAnother?: boolean;
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
  const timer = createDraftGenerationTimer(`django:${params.assetType}`);
  timer.mark("pipeline_start", { assetType: params.assetType, jdChars: params.jobDescription?.length ?? 0 });

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
  timer.mark("django_generate_draft", { contentChars: result.content?.length ?? 0 });

  const draft = result.content?.trim() ?? "";

  if (!draft) {
    timer.finish({ status: "error", reason: "empty_draft" });
    throw new Error("Could not read the generated draft. Please try again.");
  }

  const contactName = result.contact_name ?? params.contactName ?? "";
  syncStudioPreviewOnly(params, draft, {
    role: result.role || params.role,
    company: result.company || params.company,
    jobDescription: result.job_description ?? params.jobDescription,
    contactName,
  });
  timer.mark("notify_studio_ui");
  timer.finish({ assetType: params.assetType, draftChars: draft.length, path: "django" });

  return { draft };
};

/**
 * Studio form / Prepare modal: opens an ADK sub-thread (default) or Django Unibot fallback.
 * ADK path keeps preview-only until Accept; Django path does the same.
 */
export const runApplicationAssetDraftGeneration = async (
  params: RunApplicationAssetDraftParams
): Promise<RunApplicationAssetDraftResult> => {
  if (USE_ADK_APPLICATION_ASSETS) {
    const studioAssetId = params.studioAssetId?.trim() || undefined;
    const detail: ApplicationAssetOpenDraftDetail = {
      assetType: params.assetType,
      assetId: studioAssetId,
      applicationId: params.applicationId != null ? String(params.applicationId) : undefined,
      role: params.role,
      company: params.company,
      jobDescription: params.jobDescription,
      contactName: params.contactName,
      preserveExistingDraft: params.preserveExistingDraft,
      regenerateAnother: params.regenerateAnother,
    };
    window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.openDraft, { detail }));
    throw new Error(ADK_DRAFT_PENDING_ERROR);
  }
  return runDjangoApplicationAssetDraft(params);
};
