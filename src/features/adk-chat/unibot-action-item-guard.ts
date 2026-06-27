import { isTopicPickerWandUserMessage, parseFunnelFromTopicPickerUserText } from "@/components/chat/content-gen-topic";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { messageHasPlannerChips, messageShowsTopicPickerChips } from "@/features/content-lab/api/extractPlannerChips";
import type { ChatMessage } from "@/types";

export const CONTENT_GEN_TOPIC_PICKER_NUDGE =
  "Please choose an angle from the options above, or type the kind of topics you'd like as a message below.";

export const CONTENT_GEN_IMPROVE_NUDGE =
  "How would you like to improve this? Tell me what didn't work in the previous version, or tap Accept if the draft looks good.";

export const APPLICATION_ASSET_IMPROVE_NUDGE =
  "How would you like to improve this? Let me know what didn't work before, or use Accept / Discard on the review above.";

export const RESUME_IMPROVE_NUDGE =
  "How should we improve this? Use Accept or Discard on the review above, or describe what you'd like changed.";

export const LINKEDIN_IMPROVE_NUDGE =
  "How would you like to improve your LinkedIn section? Use Accept or Discard above, or tell me what to change.";

export type UnibotActionHighlightKind = "planner_chips" | "review_card";

export type UnibotActionHighlightTarget = {
  topicId: string;
  messageId: string;
  kind: UnibotActionHighlightKind;
};

export function isContentGenTopicPickerTitle(title?: string): boolean {
  const t = (title ?? "").trim().toLowerCase();
  return t === "topic picker" || t.includes("topic picker");
}

export function findContentGenTopicPickerId(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.isTopic && m.topicKind === "content_gen" && isContentGenTopicPickerTitle(m.topicTitle)) {
      return m.id;
    }
  }
  return null;
}

export function findPendingPlannerInTopic(
  topic: ChatMessage | undefined,
  dismissedChipMessageIds: ReadonlySet<string>
): { messageId: string } | null {
  if (!topic?.messages?.length) return null;
  for (let i = topic.messages.length - 1; i >= 0; i--) {
    const m = topic.messages[i];
    if (m.role !== "model" || !m.text || dismissedChipMessageIds.has(m.id)) continue;
    if (messageHasPlannerChips(m.text)) {
      return { messageId: m.id };
    }
  }
  return null;
}

/** Best assistant message to highlight when the user re-clicks the topic wand. */
export function findTopicPickerHighlightMessage(
  topic: ChatMessage | undefined,
  dismissedChipMessageIds: ReadonlySet<string>
): string | null {
  const pending = findPendingPlannerInTopic(topic, dismissedChipMessageIds);
  if (pending) return pending.messageId;
  if (!topic?.messages?.length) return null;
  for (let i = topic.messages.length - 1; i >= 0; i--) {
    const m = topic.messages[i];
    if (m.role === "model" && m.text && messageHasPlannerChips(m.text)) {
      return m.id;
    }
  }
  for (let i = topic.messages.length - 1; i >= 0; i--) {
    const m = topic.messages[i];
    if (m.role === "model" && m.text?.trim()) {
      return m.id;
    }
  }
  return null;
}

export type TopicPickerFunnelTurn = {
  userMessageId: string;
  modelMessageId: string;
  hasPendingChips: boolean;
};

/** Latest studio wand funnel in a topic-picker thread (ignores angle chip follow-ups). */
export function findLatestTopicPickerWandFunnel(topic: ChatMessage | undefined): ContentGenFunnel | null {
  if (!topic?.messages?.length) return null;
  for (let i = topic.messages.length - 1; i >= 0; i--) {
    const m = topic.messages[i];
    if (m.role !== "user" || !m.text || !isTopicPickerWandUserMessage(m.text)) continue;
    return parseFunnelFromTopicPickerUserText(m.text);
  }
  return null;
}

/** Last user→model wand turn for a specific funnel inside the topic-picker sub-thread. */
export function findTopicPickerTurnForFunnel(
  topic: ChatMessage | undefined,
  funnel: ContentGenFunnel,
  dismissedChipMessageIds: ReadonlySet<string>
): TopicPickerFunnelTurn | null {
  if (!topic?.messages?.length) return null;
  let last: TopicPickerFunnelTurn | null = null;
  const nested = topic.messages;
  for (let i = 0; i < nested.length; i++) {
    const userMsg = nested[i];
    if (userMsg.role !== "user" || !userMsg.text || !isTopicPickerWandUserMessage(userMsg.text)) {
      continue;
    }
    if (parseFunnelFromTopicPickerUserText(userMsg.text) !== funnel) {
      continue;
    }
    const modelMsg = nested.slice(i + 1).find(m => m.role === "model" && !m.isError);
    if (!modelMsg?.text?.trim() || modelMsg.text.trim() === CONTENT_GEN_TOPIC_PICKER_NUDGE) {
      continue;
    }
    const hasPendingChips = messageShowsTopicPickerChips(modelMsg.text, funnel) && !dismissedChipMessageIds.has(modelMsg.id);
    last = {
      userMessageId: userMsg.id,
      modelMessageId: modelMsg.id,
      hasPendingChips,
    };
  }
  return last;
}

type ReviewCardRef = { assistantMessageId?: string | null; id: string };

export function findPendingReviewInTopic(
  topic: ChatMessage | undefined,
  cards: ReviewCardRef[],
  activeReviewId: string | null
): { messageId: string } | null {
  if (!topic?.messages?.length || !activeReviewId) return null;
  const nestedIds = new Set(topic.messages.map(m => m.id));
  const card = cards.find(c => c.id === activeReviewId && c.assistantMessageId && nestedIds.has(c.assistantMessageId));
  if (!card?.assistantMessageId) return null;
  return { messageId: card.assistantMessageId };
}
