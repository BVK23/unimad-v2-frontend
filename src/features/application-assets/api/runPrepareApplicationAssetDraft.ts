import {
  createApplicationAssetOnAccept,
  generateApplicationAssetDraft,
} from "@/features/application-assets/server-actions/application-asset-actions";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

export type RunPrepareApplicationAssetDraftParams = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  applicationId: string;
  contactName?: string;
};

export type RunPrepareApplicationAssetDraftResult = {
  draft: string;
  assetId: string;
};

/**
 * Prepare Application modal: Django generate-draft + accept in one flow.
 * Skips ADK sub-threads — the modal owns the full generate-and-save UX.
 */
export async function runPrepareApplicationAssetDraft(
  params: RunPrepareApplicationAssetDraftParams
): Promise<RunPrepareApplicationAssetDraftResult> {
  const body = {
    type: params.assetType,
    role: params.role,
    company: params.company,
    job_description: params.jobDescription,
    application_id: params.applicationId,
    ...(params.assetType === "coldemail" && params.contactName ? { hirname: params.contactName } : {}),
    ...(params.assetType === "referral" && params.contactName ? { conname: params.contactName } : {}),
  };

  const generated = await generateApplicationAssetDraft(body);
  const draft = generated.content?.trim() ?? "";
  if (!draft) {
    throw new Error("Could not read the generated draft. Please try again.");
  }

  const accepted = await createApplicationAssetOnAccept({
    ...body,
    content: draft,
  });

  if ("error" in accepted) {
    const existingId = accepted.error.data.existing_asset_id;
    if (existingId != null && String(existingId).trim()) {
      return { draft, assetId: String(existingId) };
    }
    throw new Error(accepted.error.message ?? "Failed to save application asset");
  }

  const assetId = accepted.id != null ? String(accepted.id) : "";
  if (!assetId) {
    throw new Error("Failed to save application asset");
  }

  return { draft, assetId };
}
