/** User-facing copy for the first turn in the LinkedIn Topic sidebar thread. */
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { studioContentTypeLabelForFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_IMPROVE_AGENT_BOOTSTRAP } from "@/features/content-lab/api/contentGenDraftDisplay";

export const CONTENT_GEN_TOPIC_USER_DISPLAY = "Help me choose a LinkedIn post topic.";

const FUNNEL_TOPIC_PICKER_USER_DISPLAY: Record<ContentGenFunnel, string> = {
  top: "Help me pick a topic for the Top Funnel I have chosen.",
  middle: "Help me pick a topic for the Middle Funnel I have chosen.",
  bottom: "Help me pick a topic for the Bottom Funnel I have chosen.",
};

/** Short copy shown in the topic-picker sub-thread bubble (wand click). */
export const buildContentGenTopicUserDisplay = (funnel?: ContentGenFunnel | null): string => {
  if (funnel && funnel in FUNNEL_TOPIC_PICKER_USER_DISPLAY) {
    return FUNNEL_TOPIC_PICKER_USER_DISPLAY[funnel];
  }
  return CONTENT_GEN_TOPIC_USER_DISPLAY;
};

/** Detect studio wand kickoff (not angle chip follow-ups). */
export const isTopicPickerWandUserMessage = (text: string): boolean => {
  const trimmed = text.trim();
  if (/Help me pick a topic for the (Top|Middle|Bottom) Funnel/i.test(trimmed)) {
    return true;
  }
  if (trimmed.includes("Help me choose a LinkedIn post topic") && trimmed.includes("(funnel:")) {
    return true;
  }
  return trimmed === CONTENT_GEN_TOPIC_USER_DISPLAY;
};

export const parseFunnelFromTopicPickerUserText = (text: string): ContentGenFunnel | null => {
  const trimmed = text.trim();
  const fromDisplay = trimmed.match(/Help me pick a topic for the (Top|Middle|Bottom) Funnel/i);
  if (fromDisplay) {
    const label = fromDisplay[1].toLowerCase();
    if (label === "top" || label === "middle" || label === "bottom") {
      return label;
    }
  }
  const fromTechnical = trimmed.match(/\(funnel:\s*(top|middle|bottom)\)/i)?.[1]?.toLowerCase();
  if (fromTechnical === "top" || fromTechnical === "middle" || fromTechnical === "bottom") {
    return fromTechnical;
  }
  return null;
};

/** Agent bootstrap — may include funnel metadata for session-aware routing. */
export const buildContentGenTopicBootstrap = (seedTopic?: string, funnel?: ContentGenFunnel | null): string => {
  const trimmed = seedTopic?.trim();
  const funnelLine = funnel ? `Content Type: ${studioContentTypeLabelForFunnel(funnel)} (funnel: ${funnel}). ` : "";

  if (!trimmed) {
    return funnelLine ? `${funnelLine}Help me choose a LinkedIn post topic for this funnel.` : CONTENT_GEN_TOPIC_USER_DISPLAY;
  }

  return funnelLine
    ? `${funnelLine}Help me choose a LinkedIn post topic. Starting idea: "${trimmed}".`
    : `Help me choose a LinkedIn post topic. I'm starting with this idea: "${trimmed}".`;
};

export const buildContentGenDraftBootstrap = (topic: string, funnel?: ContentGenFunnel | null): string => {
  const trimmed = topic.trim();
  const funnelLine = funnel ? `Funnel: ${funnel}. ` : "";
  if (!trimmed) {
    return `${funnelLine}Write the full LinkedIn post draft for my chosen topic.`;
  }
  return `${funnelLine}Write the full LinkedIn post draft for my topic: "${trimmed}".`;
};

/** User or agent bootstrap for a LinkedIn post draft sub-thread turn (not topic picker). */
export const isContentGenDraftBootstrapUserMessage = (text: string | undefined): boolean => {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return false;
  return /Write the full LinkedIn post draft/i.test(trimmed);
};

export const isContentGenDraftSubThread = (threadMessages: Array<{ role: string; text?: string }> | undefined): boolean => {
  if (!threadMessages?.length) return false;
  return threadMessages.some(m => {
    if (m.role !== "user" || !m.text?.trim()) return false;
    if (isContentGenDraftBootstrapUserMessage(m.text)) return true;
    return m.text.trim() === "I'd like to improve this LinkedIn post draft.";
  });
};

export const buildContentGenImproveBootstrap = (): string => CONTENT_GEN_IMPROVE_AGENT_BOOTSTRAP;

/** Map stored message text to friendly UI (covers older sessions with technical bootstrap). */
/** Funnel for a planner model bubble — from the nearest preceding wand user turn. */
export const resolveFunnelForPlannerModelMessage = (
  topic: { messages?: Array<{ id: string; role: string; text?: string }> } | undefined,
  modelMessageId: string
): ContentGenFunnel | null => {
  const nested = topic?.messages;
  if (!nested?.length) return null;
  const modelIdx = nested.findIndex(m => m.id === modelMessageId);
  if (modelIdx < 0) return null;
  for (let i = modelIdx - 1; i >= 0; i--) {
    const m = nested[i];
    if (m.role !== "user" || !m.text || !isTopicPickerWandUserMessage(m.text)) continue;
    return parseFunnelFromTopicPickerUserText(m.text);
  }
  return null;
};

export const contentGenTopicUserDisplayText = (sentText: string): string => {
  const trimmed = sentText.trim();
  if (!trimmed) return trimmed;

  const funnelFromTechnical = trimmed.match(/\(funnel:\s*(top|middle|bottom)\)/i)?.[1]?.toLowerCase() as ContentGenFunnel | undefined;
  if (trimmed.includes("Help me choose a LinkedIn post topic") && (trimmed.includes("Content Type:") || trimmed.includes("(funnel:"))) {
    return buildContentGenTopicUserDisplay(funnelFromTechnical ?? null);
  }

  if (
    sentText.includes("get_content_gen_context") ||
    sentText.includes("fetch_user_personal_details") ||
    sentText.includes("affirmation chips")
  ) {
    const seedMatch =
      sentText.match(/starting idea:\s*"([^"]+)"/i) ??
      sentText.match(/idea:\s*"([^"]+)"/i) ??
      sentText.match(/starting with this idea:\s*"([^"]+)"/i);
    const funnelMatch = sentText.match(/funnel:\s*(top|middle|bottom)/i);
    const funnel = funnelMatch?.[1]?.toLowerCase() as ContentGenFunnel | undefined;
    if (seedMatch?.[1]) {
      return buildContentGenTopicUserDisplay(funnel ?? null);
    }
    return buildContentGenTopicUserDisplay(funnel ?? null);
  }
  return sentText;
};
