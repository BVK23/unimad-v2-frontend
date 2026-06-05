import { useAdkContentGenReviewStore } from "@/features/adk-chat/stores/useAdkContentGenReviewStore";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { contentGenTopicsEqual, truncateContentGenTopic } from "@/features/content-lab/api/contentGenTopicUtils";
import { extractContentGenDraftPayload } from "@/features/content-lab/api/extractContentGenDraft";
import {
  resolveContentGenDraftTopic,
  type ResolveContentGenDraftTopicParams,
} from "@/features/content-lab/api/resolveContentGenDraftTopic";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";

export type OfferContentGenDraftReviewParams = {
  botMessage: string;
  assistantMessageId: string;
  pathname: string | null;
  topicOverride?: string;
  funnelOverride?: ContentGenFunnel | null;
  appliedTopicRef?: string | null;
  threadMessages?: ResolveContentGenDraftTopicParams["threadMessages"];
};

/**
 * When a draft is detected: open Accept/Discard review and preview on Studio (if on Studio + topic set).
 */
export const offerContentGenDraftReview = (params: OfferContentGenDraftReviewParams): boolean => {
  if (isApplicationAssetBotMessage(params.botMessage)) {
    return false;
  }
  const payload = extractContentGenDraftPayload(params.botMessage);
  const proposedDraft = payload.draft;
  if (proposedDraft.length < CONTENT_GEN_MIN_DRAFT_CHARS) {
    return false;
  }

  const studio = useContentGenStudioStore.getState();
  const resolved = resolveContentGenDraftTopic({
    botMessage: params.botMessage,
    topicOverride: params.topicOverride,
    appliedTopicRef: params.appliedTopicRef,
    studioTopic: studio.topic,
    threadMessages: params.threadMessages,
    beforeMessageId: params.assistantMessageId,
  });

  const topic = resolved.topic.trim();
  if (!topic) {
    return false;
  }

  const funnel = params.funnelOverride ?? resolved.funnel ?? studio.funnel;
  const baselineTopic = studio.topic.trim();
  const baselineAssetId = studio.assetId;
  const baselineFunnel = studio.funnel;
  const baselineDraft = studio.draftPreview?.trim() ?? "";
  const isTopicChange = Boolean(baselineTopic) && !contentGenTopicsEqual(baselineTopic, topic);
  const onStudio = Boolean(params.pathname?.startsWith("/uniboard/studio"));

  const bannerTitle = isTopicChange
    ? resolved.topicInferredFromDraft
      ? `Draft topic: "${truncateContentGenTopic(topic)}". Review in Studio, then accept or discard.`
      : `New topic: "${truncateContentGenTopic(topic)}". Review the draft in Studio, then accept or discard.`
    : "Review the LinkedIn post edit in Studio, then accept or discard.";

  useAdkContentGenReviewStore.getState().beginReview({
    assistantMessageId: params.assistantMessageId,
    topic,
    funnel,
    baselineDraft,
    proposedDraft,
    bannerTitle,
    baselineTopic,
    baselineAssetId,
    baselineFunnel,
    isTopicChange,
  });

  if (onStudio) {
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.draftPreview, {
        detail: {
          draft: proposedDraft,
          topic,
          funnel,
          assetId: isTopicChange ? null : baselineAssetId,
          isTopicChange,
        },
      })
    );
  }

  window.dispatchEvent(new CustomEvent(CONTENT_GEN_EVENTS.draftStreamComplete));

  return true;
};
