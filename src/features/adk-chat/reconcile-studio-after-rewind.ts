"use client";

import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import { offerApplicationAssetDraftReview } from "@/features/application-assets/api/offerApplicationAssetDraftReview";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { extractContentGenDraftPayload } from "@/features/content-lab/api/extractContentGenDraft";
import { offerContentGenDraftReview } from "@/features/content-lab/api/offerContentGenDraftReview";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import type { ContentScope } from "@/src/features/adk-chat/content-scope";
import type { ChatMessage } from "@/types";

function parseAssetTypeFromScope(scope: ContentScope | null | undefined): ApplicationAssetApiType | null {
  const section = scope?.section?.trim().toLowerCase();
  if (section === "coverletter" || section === "coldemail" || section === "referral") {
    return section;
  }
  const typePart = scope?.contentKey.split(":")[1]?.trim().toLowerCase();
  if (typePart === "coverletter" || typePart === "coldemail" || typePart === "referral") {
    return typePart;
  }
  return null;
}

function findBaselineDraftBeforeBot(botMessages: ChatMessage[], beforeIndex: number, domain: "application_asset" | "content_gen"): string {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const text = botMessages[index]?.text ?? "";
    if (domain === "application_asset") {
      const draft = extractApplicationAssetDraftPayload(text).draft.trim();
      if (draft) {
        return draft;
      }
    } else {
      const draft = extractContentGenDraftPayload(text).draft.trim();
      if (draft) {
        return draft;
      }
    }
  }

  if (domain === "application_asset") {
    const studio = useApplicationAssetStudioStore.getState();
    return studio.acceptedContent.trim() || studio.draftPreview.trim();
  }

  return useContentGenStudioStore.getState().draftPreview.trim();
}

function threadMessagesToOfferThread(messages: ChatMessage[]) {
  return messages.map(message => ({
    id: message.id,
    role: message.role,
    text: message.text,
  }));
}

function pushApplicationAssetPreviewFromStore(assetType: ApplicationAssetApiType): boolean {
  const studio = useApplicationAssetStudioStore.getState();
  const draft = studio.acceptedContent.trim() || studio.draftPreview.trim();
  if (!draft) {
    return false;
  }

  useApplicationAssetStudioStore.getState().syncFromStudio({
    assetType,
    draftPreview: draft,
    acceptedContent: studio.acceptedContent.trim() || draft,
  });

  window.dispatchEvent(
    new CustomEvent(APPLICATION_ASSET_EVENTS.draftPreview, {
      detail: {
        draft,
        assetType,
        role: studio.role,
        company: studio.company,
        jobDescription: studio.jobDescription,
        contactName: studio.contactName || undefined,
        assetId: studio.assetId,
      },
    })
  );
  window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
  return true;
}

function pushContentGenPreviewFromStore(): boolean {
  const studio = useContentGenStudioStore.getState();
  const draft = studio.draftPreview.trim();
  if (!draft || !studio.topic.trim()) {
    return false;
  }

  window.dispatchEvent(
    new CustomEvent(CONTENT_GEN_EVENTS.draftPreview, {
      detail: {
        draft,
        topic: studio.topic,
        funnel: studio.funnel,
        assetId: studio.assetId,
        isTopicChange: false,
      },
    })
  );
  window.dispatchEvent(new CustomEvent(CONTENT_GEN_EVENTS.draftStreamComplete));
  return true;
}

/**
 * After rewind with editor revert, align Studio preview/review with the last remaining
 * assistant turn in the rewound thread (cover letter, cold email, referral, LinkedIn post).
 */
export function reconcileStudioContentAfterRewind(params: {
  threadMessages: ChatMessage[];
  targetScope: ContentScope | null | undefined;
  userId: string;
  reviewMainSessionId: string;
  pathname: string;
  appliedTopicRef?: string | null;
}): boolean {
  const domain = params.targetScope?.domain;
  if (domain !== "application_asset" && domain !== "content_gen") {
    return false;
  }

  const botMessages = params.threadMessages.filter(
    message => message.role === "model" && Boolean(message.text?.trim()) && !message.isError
  );
  const thread = threadMessagesToOfferThread(params.threadMessages);
  const onStudio = params.pathname.startsWith("/uniboard/studio");
  const forceStudioPreview = onStudio;

  if (domain === "application_asset") {
    const assetTypeOverride = parseAssetTypeFromScope(params.targetScope) ?? undefined;

    for (let index = botMessages.length - 1; index >= 0; index -= 1) {
      const bot = botMessages[index]!;
      const offered = offerApplicationAssetDraftReview({
        botMessage: bot.text,
        assistantMessageId: bot.id,
        pathname: params.pathname,
        assetTypeOverride,
        threadMessages: thread,
        userId: params.userId,
        sessionId: params.reviewMainSessionId,
        forceOfferAfterRewind: true,
        forceStudioPreview,
        baselineDraftOverride: findBaselineDraftBeforeBot(botMessages, index, "application_asset"),
      });
      if (offered) {
        return true;
      }
    }

    if (assetTypeOverride) {
      return pushApplicationAssetPreviewFromStore(assetTypeOverride);
    }
    return false;
  }

  for (let index = botMessages.length - 1; index >= 0; index -= 1) {
    const bot = botMessages[index]!;
    const offered = offerContentGenDraftReview({
      botMessage: bot.text,
      assistantMessageId: bot.id,
      pathname: params.pathname,
      appliedTopicRef: params.appliedTopicRef,
      threadMessages: thread,
      userId: params.userId,
      sessionId: params.reviewMainSessionId,
      forceOfferAfterRewind: true,
      forceStudioPreview,
      baselineDraftOverride: findBaselineDraftBeforeBot(botMessages, index, "content_gen"),
    });
    if (offered) {
      return true;
    }
  }

  return pushContentGenPreviewFromStore();
}
