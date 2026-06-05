import {
  buildContentGenDraftBootstrap,
  CONTENT_GEN_TOPIC_USER_DISPLAY,
  contentGenTopicUserDisplayText,
} from "@/components/chat/content-gen-topic";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import {
  contentGenTopicsEqual,
  inferTopicFromDraftText,
  isContentGenMetaChipLabel,
  isContentGenUserInstructionMessage,
  isValidContentGenTopicTitle,
} from "@/features/content-lab/api/contentGenTopicUtils";
import { extractContentGenDraftPayload } from "@/features/content-lab/api/extractContentGenDraft";
import { parsePlannerChips } from "@/features/content-lab/api/extractPlannerChips";
import { parseGenerateDraftRequest } from "@/features/content-lab/api/parseGenerateDraftRequest";

type ThreadMessageLike = {
  id?: string;
  role: string;
  text?: string;
};

export type ResolveContentGenDraftTopicParams = {
  botMessage: string;
  topicOverride?: string;
  appliedTopicRef?: string | null;
  studioTopic?: string;
  threadMessages?: ThreadMessageLike[];
  beforeMessageId?: string;
};

const DRAFT_BOOTSTRAP_TOPIC_REGEX = /Write the full LinkedIn post draft for my topic:\s*"([^"]+)"/i;

const isDraftCommandMessage = (text: string): boolean => {
  return (
    /\bgenerate(?:\s+a|\s+another)?\s+draft\b/i.test(text) ||
    text === CONTENT_GEN_TOPIC_USER_DISPLAY ||
    text.startsWith("Help me choose a LinkedIn post topic")
  );
};

const pickTopicCandidate = (candidate: string | null | undefined): string | null => {
  const trimmed = candidate?.trim() ?? "";
  if (!trimmed || !isValidContentGenTopicTitle(trimmed)) {
    return null;
  }
  return trimmed;
};

const getSliceEndIndex = (messages: ThreadMessageLike[], beforeMessageId?: string): number => {
  if (!beforeMessageId) {
    return messages.length;
  }
  const idx = messages.findIndex(m => m.id === beforeMessageId);
  return idx >= 0 ? idx : messages.length;
};

const getLastUserMessageBefore = (messages: ThreadMessageLike[] | undefined, beforeMessageId?: string): string | null => {
  if (!messages?.length) {
    return null;
  }
  const endIdx = getSliceEndIndex(messages, beforeMessageId);
  for (let i = endIdx - 1; i >= 0; i--) {
    const text = messages[i]?.text?.trim() ?? "";
    if (messages[i]?.role === "user" && text) {
      return text;
    }
  }
  return null;
};

const tokenizeForTopicMatch = (text: string): string[] => {
  const stop = new Set(["the", "and", "for", "with", "from", "your", "how", "has", "have", "been", "into", "that", "this"]);
  return (text.toLowerCase().match(/\b[a-z0-9]{3,}\b/g) ?? []).filter(t => !stop.has(t));
};

const collectPlannerTopicsFromThread = (messages: ThreadMessageLike[] | undefined, beforeMessageId?: string): string[] => {
  if (!messages?.length) {
    return [];
  }
  const endIdx = getSliceEndIndex(messages, beforeMessageId);
  const seen = new Set<string>();
  const out: string[] = [];

  for (let i = 0; i < endIdx; i++) {
    const message = messages[i];
    if (message.role !== "model" || !message.text?.trim()) {
      continue;
    }
    const { topics } = parsePlannerChips(message.text);
    for (const topic of topics) {
      const picked = pickTopicCandidate(topic);
      if (!picked) {
        continue;
      }
      const key = picked.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(picked);
    }
  }

  return out;
};

/** When user asked AI to pick, match planner suggestions against draft keywords (e.g. TypeScript). */
const matchPlannerTopicToDraft = (topics: string[], draft: string): string | null => {
  if (!topics.length || !draft.trim()) {
    return null;
  }

  const draftTokens = new Set(tokenizeForTopicMatch(draft));
  let best: { topic: string; score: number } | null = null;

  for (const topic of topics) {
    const topicTokens = tokenizeForTopicMatch(topic);
    let score = 0;
    for (const token of topicTokens) {
      if (draftTokens.has(token)) {
        score += token.length >= 6 ? 2 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score };
    }
  }

  return best?.topic ?? null;
};

const resolveTopicFromThreadBotMessages = (messages: ThreadMessageLike[] | undefined, beforeMessageId?: string): string | null => {
  if (!messages?.length) {
    return null;
  }

  const endIdx = getSliceEndIndex(messages, beforeMessageId);

  for (let i = endIdx - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "model" || !message.text?.trim()) {
      continue;
    }

    const { topics } = parsePlannerChips(message.text);
    if (topics.length === 0) {
      continue;
    }

    if (topics.length === 1) {
      const picked = pickTopicCandidate(topics[0]);
      if (picked) {
        return picked;
      }
    }

    for (let j = i + 1; j < endIdx; j++) {
      const userText = messages[j]?.text?.trim() ?? "";
      if (!userText || isContentGenUserInstructionMessage(userText)) {
        continue;
      }
      const matched = topics.find(t => contentGenTopicsEqual(t, userText));
      if (matched) {
        const picked = pickTopicCandidate(matched);
        if (picked) {
          return picked;
        }
      }
    }
  }

  return null;
};

const resolveTopicFromThreadUserMessages = (messages: ThreadMessageLike[] | undefined, beforeMessageId?: string): string | null => {
  if (!messages?.length) {
    return null;
  }

  const endIdx = getSliceEndIndex(messages, beforeMessageId);

  for (let i = endIdx - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }

    const text = message.text?.trim() ?? "";
    if (!text) {
      continue;
    }

    const bootstrapMatch = text.match(DRAFT_BOOTSTRAP_TOPIC_REGEX);
    if (bootstrapMatch?.[1]?.trim()) {
      const picked = pickTopicCandidate(bootstrapMatch[1]);
      if (picked) {
        return picked;
      }
    }

    const draftIntent = parseGenerateDraftRequest(text);
    if (draftIntent?.topic?.trim()) {
      const picked = pickTopicCandidate(draftIntent.topic);
      if (picked) {
        return picked;
      }
    }

    if (isDraftCommandMessage(text) || isContentGenMetaChipLabel(text) || isContentGenUserInstructionMessage(text)) {
      continue;
    }

    const displayText = contentGenTopicUserDisplayText(text);
    if (displayText !== text && displayText.includes("LinkedIn post topic")) {
      continue;
    }

    const picked = pickTopicCandidate(text);
    if (picked) {
      return picked;
    }
  }

  return null;
};

export type ResolvedContentGenDraftTopic = {
  topic: string;
  funnel: ContentGenFunnel | null;
  topicInferredFromDraft: boolean;
};

/**
 * Resolve the LinkedIn topic for a draft offer (ADK JSON → planner match → draft inference).
 */
export const resolveContentGenDraftTopic = (params: ResolveContentGenDraftTopicParams): ResolvedContentGenDraftTopic => {
  const payload = extractContentGenDraftPayload(params.botMessage);

  const lastUserMessage = getLastUserMessageBefore(params.threadMessages, params.beforeMessageId);
  const userAskedAiToPick = Boolean(lastUserMessage && isContentGenUserInstructionMessage(lastUserMessage));
  const plannerTopics = collectPlannerTopicsFromThread(params.threadMessages, params.beforeMessageId);
  const fromPlannerMatch = userAskedAiToPick ? matchPlannerTopicToDraft(plannerTopics, payload.draft) : null;
  const fromBotPlanner = resolveTopicFromThreadBotMessages(params.threadMessages, params.beforeMessageId);
  const fromDraft = inferTopicFromDraftText(payload.draft);
  const fromThreadUser = userAskedAiToPick ? null : resolveTopicFromThreadUserMessages(params.threadMessages, params.beforeMessageId);

  const candidates = [
    pickTopicCandidate(payload.topic),
    fromPlannerMatch,
    fromBotPlanner,
    fromDraft,
    pickTopicCandidate(params.topicOverride),
    fromThreadUser,
    pickTopicCandidate(params.appliedTopicRef),
    pickTopicCandidate(params.studioTopic),
  ];

  const topic = candidates.find(Boolean) ?? "";
  const topicInferredFromDraft = Boolean(topic && fromDraft && topic === fromDraft);

  return {
    topic,
    funnel: payload.funnel ?? null,
    topicInferredFromDraft,
  };
};

/** Topic embedded in a draft-thread bootstrap user message. */
export const topicFromDraftBootstrap = (text: string): string | null => {
  const match = text.match(DRAFT_BOOTSTRAP_TOPIC_REGEX);
  return match?.[1]?.trim() ?? null;
};

export const buildDraftBootstrapForTopic = (topic: string): string => buildContentGenDraftBootstrap(topic);
