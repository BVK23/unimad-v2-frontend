import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import { resolveApplicationAssetDraftContext } from "@/features/application-assets/api/resolveApplicationAssetDraftContext";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

type ThreadMessageLike = {
  id?: string;

  role: string;

  text?: string;
};

export type OfferApplicationAssetDraftReviewParams = {
  botMessage: string;

  assistantMessageId: string;

  pathname: string | null;

  assetTypeOverride?: ApplicationAssetApiType;

  threadMessages?: ThreadMessageLike[];
};

const pushStudioContext = (ctx: {
  assetType: ApplicationAssetApiType;

  role: string;

  company: string;

  jobDescription: string;

  contactName: string;

  draft: string;

  assetId: string | null;
}) => {
  useApplicationAssetStudioStore.getState().syncFromStudio({
    assetType: ctx.assetType,

    assetId: ctx.assetId,

    role: ctx.role,

    company: ctx.company,

    jobDescription: ctx.jobDescription,

    contactName: ctx.contactName,

    draftPreview: ctx.draft,

    acceptedContent: "",
  });

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.applyContext, {
      detail: {
        assetType: ctx.assetType,

        role: ctx.role,

        company: ctx.company,

        jobDescription: ctx.jobDescription,

        contactName: ctx.contactName || undefined,

        assetId: ctx.assetId,
      },
    })
  );

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.draftPreview, {
      detail: {
        draft: ctx.draft,

        assetType: ctx.assetType,

        role: ctx.role,

        company: ctx.company,

        jobDescription: ctx.jobDescription,
        contactName: ctx.contactName || undefined,
        assetId: ctx.assetId,
      },
    })
  );

  window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
};

const isDifferentJobContext = (baselineRole: string, baselineCompany: string, proposedRole: string, proposedCompany: string): boolean => {
  const norm = (s: string) => s.trim().toLowerCase();
  return norm(baselineRole) !== norm(proposedRole) || norm(baselineCompany) !== norm(proposedCompany);
};

export const offerApplicationAssetDraftReview = (params: OfferApplicationAssetDraftReviewParams): boolean => {
  const proposedDraft = extractApplicationAssetDraftPayload(params.botMessage).draft.trim();

  if (proposedDraft.length < APPLICATION_ASSET_MIN_DRAFT_CHARS) {
    return false;
  }

  const studio = useApplicationAssetStudioStore.getState();

  const resolved = resolveApplicationAssetDraftContext({
    botMessage: params.botMessage,

    assetTypeOverride: params.assetTypeOverride ?? studio.assetType,

    studioAssetType: studio.assetType,

    studioRole: studio.role,

    studioCompany: studio.company,

    studioJobDescription: studio.jobDescription,

    studioContactName: studio.contactName,

    threadMessages: params.threadMessages,

    beforeMessageId: params.assistantMessageId,
  });

  if (!resolved) {
    return false;
  }

  const { assetType, role, company, jobDescription, contactName } = resolved;

  const baselineDraft = studio.acceptedContent.trim() || studio.draftPreview.trim();
  const baselineAssetId = studio.assetId;
  const baselineRole = studio.role;
  const baselineCompany = studio.company;
  const baselineJobDescription = studio.jobDescription;
  const baselineContactName = studio.contactName;

  const refineCtx = useApplicationAssetStudioStore.getState().consumePendingRefineContext();

  const onStudio = Boolean(params.pathname?.startsWith("/uniboard/studio"));

  useAdkApplicationAssetReviewStore.getState().beginReview({
    assistantMessageId: params.assistantMessageId,
    assetType,
    role,
    company,
    jobDescription,
    contactName,
    baselineRole,
    baselineCompany,
    baselineJobDescription,
    baselineContactName,
    baselineDraft,
    proposedDraft,
    baselineAssetId,
    anchorSelectedText: refineCtx?.selectedText,
    presetLabel: refineCtx?.presetLabel,
  });

  if (onStudio) {
    const previewAssetId = isDifferentJobContext(baselineRole, baselineCompany, role, company) ? null : baselineAssetId;
    pushStudioContext({
      assetType,
      role,
      company,
      jobDescription,
      contactName,
      draft: proposedDraft,
      assetId: previewAssetId,
    });
  } else {
    window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
  }

  return true;
};
