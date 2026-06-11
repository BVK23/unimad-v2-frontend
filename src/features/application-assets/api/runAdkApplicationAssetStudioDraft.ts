"use client";

import { createSessionAction, deleteSessionAction, syncSessionStateAction } from "@/features/adk-chat/actions";
import { runHeadlessAdkStream } from "@/features/adk-chat/runHeadlessAdkStream";
import { getAdkUserId } from "@/features/adk-chat/server-actions/get-adk-user-id";
import { buildAdkApplicationAssetStateDelta } from "@/features/application-assets/api/adk-mappers";
import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { buildApplicationAssetDraftBootstrap } from "@/features/application-assets/api/applicationAssetDraftBootstrap";
import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import type { RunApplicationAssetDraftParams } from "@/features/application-assets/api/runApplicationAssetDraftGeneration";
import { createApplicationAssetOnAccept } from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { looksLikeTechnicalErrorMessage } from "@/utils/message-from-failed-response";

export type RunAdkApplicationAssetStudioDraftResult = {
  draft: string;
  assetId: string;
};

const persistGeneratedAsset = async (
  params: RunApplicationAssetDraftParams,
  draft: string,
  extracted: ReturnType<typeof extractApplicationAssetDraftPayload>
): Promise<string> => {
  const role = extracted.role?.trim() || params.role.trim();
  const company = extracted.company?.trim() || params.company.trim();
  const jobDescription = extracted.jobDescription?.trim() || params.jobDescription.trim();
  const contactName = extracted.contactName?.trim() || params.contactName?.trim() || "";

  const body = {
    type: params.assetType,
    role,
    company,
    job_description: jobDescription,
    content: draft,
    application_id: params.applicationId,
    ...(params.assetType === "coldemail" && contactName ? { hirname: contactName } : {}),
    ...(params.assetType === "referral" && contactName ? { conname: contactName } : {}),
  };

  const result = await createApplicationAssetOnAccept(body);
  if ("error" in result) {
    throw new Error(result.error.message ?? "A document already exists for this application");
  }
  return String(result.id);
};

const notifyStudio = (
  params: RunApplicationAssetDraftParams,
  draft: string,
  assetId: string,
  meta: {
    role: string;
    company: string;
    jobDescription: string;
    contactName: string;
  }
) => {
  useApplicationAssetStudioStore.getState().syncFromStudio({
    assetType: params.assetType,
    assetId,
    role: meta.role,
    company: meta.company,
    jobDescription: meta.jobDescription,
    contactName: meta.contactName,
    draftPreview: draft,
    acceptedContent: draft,
  });

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.applyContext, {
      detail: {
        assetType: params.assetType,
        role: meta.role,
        company: meta.company,
        jobDescription: meta.jobDescription,
        contactName: meta.contactName || undefined,
        assetId,
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
        assetId,
      },
    })
  );

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.draftReady, {
      detail: {
        assetId,
        assetType: params.assetType,
        draft,
        role: meta.role,
        company: meta.company,
        jobDescription: meta.jobDescription,
        contactName: meta.contactName || undefined,
      },
    })
  );

  window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
};

/**
 * Studio form: ADK generation in an ephemeral session (no chat sidebar), then persist to Django with id.
 */
export const runAdkApplicationAssetStudioDraft = async (
  params: RunApplicationAssetDraftParams
): Promise<RunAdkApplicationAssetStudioDraftResult> => {
  const userId = await getAdkUserId();
  if (!userId) {
    throw new Error("Could not resolve your account for draft generation. Please sign in again.");
  }

  const contactName = params.contactName?.trim() ?? "";
  const bootstrap = buildApplicationAssetDraftBootstrap(params.assetType, params.role, params.company, params.jobDescription, contactName);

  const created = await createSessionAction(userId);
  if (!created.success || !created.sessionId) {
    throw new Error(created.error ?? "Could not start draft generation session.");
  }

  const sessionId = created.sessionId;

  try {
    const stateDelta = buildAdkApplicationAssetStateDelta({
      assetType: params.assetType,
      assetId: params.applicationId != null ? String(params.applicationId) : null,
      role: params.role,
      company: params.company,
      jobDescription: params.jobDescription,
      contactName,
      draftPreview: "",
      acceptedBody: "",
    });

    const syncResult = await syncSessionStateAction(userId, sessionId, {
      ...stateDelta,
      django_username: userId,
    });
    if (!syncResult.success) {
      throw new Error(syncResult.error ?? "Could not sync Studio context with the agent.");
    }

    const botMessage = await runHeadlessAdkStream({ userId, sessionId, message: bootstrap });
    if (looksLikeTechnicalErrorMessage(botMessage)) {
      throw new Error("Could not generate your draft. Please try again.");
    }
    const extracted = extractApplicationAssetDraftPayload(botMessage);
    const draft = extracted.draft.trim();

    if (draft.length < APPLICATION_ASSET_MIN_DRAFT_CHARS) {
      throw new Error("Could not read the generated draft. Please try again.");
    }

    const assetId = await persistGeneratedAsset(params, draft, extracted);
    const meta = {
      role: extracted.role?.trim() || params.role.trim(),
      company: extracted.company?.trim() || params.company.trim(),
      jobDescription: extracted.jobDescription?.trim() || params.jobDescription.trim(),
      contactName: extracted.contactName?.trim() || contactName,
    };

    notifyStudio(params, draft, assetId, meta);

    return { draft, assetId };
  } finally {
    void deleteSessionAction(userId, sessionId);
  }
};
