import { shouldOfferDraftReview } from "@/features/adk-chat/review-decisions";
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
  /** When set, use this draft instead of parsing botMessage (e.g. ADK session pull). */
  proposedDraftOverride?: string;
  appliedTopicRef?: string | null;
  threadMessages?: ResolveContentGenDraftTopicParams["threadMessages"];
  userId?: string;
  sessionId?: string;
  /** When false, open the review card only — do not sync draft into Studio stores/events. */
  syncStudioPreview?: boolean;
  /** After rewind: allow re-offering review even if a decision was already recorded. */
  forceOfferAfterRewind?: boolean;
  /** Push draft into Studio via events even when not currently on /uniboard/studio. */
  forceStudioPreview?: boolean;
  /** Baseline draft for review diff (e.g. prior assistant turn after rewind). */
  baselineDraftOverride?: string;
};

/**
 * When a draft is detected: open Accept/Discard review and preview on Studio (if on Studio + topic set).
 */
export const offerContentGenDraftReview = (params: OfferContentGenDraftReviewParams): boolean => {
  if (
    params.userId &&
    params.sessionId &&
    !params.forceOfferAfterRewind &&
    !shouldOfferDraftReview(params.userId, params.sessionId, params.assistantMessageId)
  ) {
    return false;
  }
  if (isApplicationAssetBotMessage(params.botMessage)) {
    return false;
  }
  const payload = extractContentGenDraftPayload(params.botMessage);
  const proposedDraft = params.proposedDraftOverride?.trim() || payload.draft;
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
  const baselineDraft = params.baselineDraftOverride?.trim() || studio.draftPreview?.trim() || "";
  const isTopicChange = Boolean(baselineTopic) && !contentGenTopicsEqual(baselineTopic, topic);
  const onStudio = Boolean(params.pathname?.startsWith("/uniboard/studio"));
  const shouldSyncStudioPreview = params.forceStudioPreview || (onStudio && params.syncStudioPreview !== false);

  const bannerTitle = isTopicChange
    ? resolved.topicInferredFromDraft
      ? `Draft topic: "${truncateContentGenTopic(topic)}". Review in Studio, then accept or improve.`
      : `New topic: "${truncateContentGenTopic(topic)}". Review the draft in Studio, then accept or improve.`
    : "Review the LinkedIn post edit in Studio, then accept or improve.";

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

  if (shouldSyncStudioPreview) {
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
