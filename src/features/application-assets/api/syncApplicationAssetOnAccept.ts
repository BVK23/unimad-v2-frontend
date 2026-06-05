import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import {
  acceptApplicationAsset,
  createApplicationAssetOnAccept,
} from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

export type SyncApplicationAssetOnAcceptParams = {
  assetType: ApplicationAssetApiType;
  proposedDraft: string;
  assetId?: string | null;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
  applicationId?: string | null;
};

export const syncApplicationAssetOnAccept = async (params: SyncApplicationAssetOnAcceptParams): Promise<{ assetId: string }> => {
  const studio = useApplicationAssetStudioStore.getState();
  const existingId = params.assetId?.trim() || studio.assetId?.trim() || "";

  let assetId = existingId;

  if (existingId) {
    await acceptApplicationAsset(params.assetType, existingId, params.proposedDraft);
  } else {
    const role = params.role?.trim() || studio.role.trim();
    const company = params.company?.trim() || studio.company.trim();
    const job_description = params.jobDescription?.trim() || studio.jobDescription.trim();
    const result = await createApplicationAssetOnAccept({
      type: params.assetType,
      role,
      company,
      job_description,
      content: params.proposedDraft,
      application_id: params.applicationId ?? studio.applicationId ?? undefined,
      hirname: params.assetType === "coldemail" ? (params.contactName ?? studio.contactName) : undefined,
      conname: params.assetType === "referral" ? (params.contactName ?? studio.contactName) : undefined,
    });
    if ("error" in result) {
      throw new Error(result.error.message ?? "A document already exists for this application");
    }
    assetId = String(result.id);
    useApplicationAssetStudioStore.getState().syncFromStudio({
      assetId,
      applicationId: result.application_id ?? studio.applicationId,
      acceptedContent: params.proposedDraft,
      draftPreview: params.proposedDraft,
    });
  }

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.draftReady, {
      detail: {
        assetId,
        assetType: params.assetType,
        draft: params.proposedDraft,
        role: params.role?.trim() || studio.role,
        company: params.company?.trim() || studio.company,
        jobDescription: params.jobDescription?.trim() || studio.jobDescription,
        contactName: params.contactName ?? studio.contactName,
      },
    })
  );

  return { assetId };
};
