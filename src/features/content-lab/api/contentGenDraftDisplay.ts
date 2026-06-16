import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { extractContentGenDraftFromBotMessage } from "@/features/content-lab/api/extractContentGenDraft";

const DRAFT_INTRO_PATTERNS = [
  /here'?s (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /here is (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve (written|created|generated) (a )?draft[^.!?\n]*[.!?]?/gi,
];

export const CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE =
  "I've updated your LinkedIn post draft. Please review the edit in Studio, then accept or improve below.";

export const CONTENT_GEN_NEW_TOPIC_DRAFT_REVIEW_USER_MESSAGE =
  "I've drafted a LinkedIn post for a new topic. Please review it in Studio, then accept or improve below.";

export const CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE =
  "I'd like to improve this draft. What would you like to know about how I want it changed?";

export const messageHasContentGenDraft = (botMessage: string): boolean => {
  if (isApplicationAssetBotMessage(botMessage)) {
    return false;
  }
  return extractContentGenDraftFromBotMessage(botMessage).length >= CONTENT_GEN_MIN_DRAFT_CHARS;
};

/** Hide machine-readable draft JSON and use review-oriented copy in chat bubbles. */
export const stripContentGenDraftFromMessage = (botMessage: string): string => {
  let visible = stripMachineReadablePayloadFromMessage(botMessage);

  if (isApplicationAssetBotMessage(botMessage) || !messageHasContentGenDraft(botMessage)) {
    return visible;
  }

  for (const pattern of DRAFT_INTRO_PATTERNS) {
    visible = visible.replace(pattern, "").trim();
  }

  if (!visible || visible.length < 24) {
    return CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE;
  }

  return `${visible}\n\n${CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE}`;
};
