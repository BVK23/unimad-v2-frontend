import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { extractContentGenDraftFromBotMessage } from "@/features/content-lab/api/extractContentGenDraft";

const DRAFT_INTRO_PATTERNS = [
  /here'?s (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /here is (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve (written|created|generated) (a )?draft[^.!?\n]*[.!?]?/gi,
];

export const CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE = "Accept or click Improve to keep working on it.";

export const CONTENT_GEN_NEW_TOPIC_DRAFT_REVIEW_USER_MESSAGE =
  "Review your new LinkedIn post draft in Studio. Accept or click Improve to keep working on it.";

export const CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE = "I'd like to improve this LinkedIn post draft.";

/** Short agent bootstrap — draft body lives in session via get_post_draft. */
export const CONTENT_GEN_IMPROVE_AGENT_BOOTSTRAP = "Improve my LinkedIn post draft.";

export const messageHasContentGenDraft = (botMessage: string): boolean => {
  if (isApplicationAssetBotMessage(botMessage)) {
    return false;
  }
  return extractContentGenDraftFromBotMessage(botMessage).length >= CONTENT_GEN_MIN_DRAFT_CHARS;
};

function dedupeRepeatedLines(text: string): string {
  const lines = text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    if (out.length > 0 && out[out.length - 1] === line) {
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** Hide machine-readable draft JSON and use review-oriented copy in chat bubbles. */
export const stripContentGenDraftFromMessage = (botMessage: string): string => {
  let visible = stripMachineReadablePayloadFromMessage(botMessage);
  visible = dedupeRepeatedLines(visible);

  if (isApplicationAssetBotMessage(botMessage)) {
    return visible;
  }

  const hasDraftPayload = messageHasContentGenDraft(botMessage);
  const looksLikeFullPost = !hasDraftPayload && visible.length >= CONTENT_GEN_MIN_DRAFT_CHARS && !visible.toLowerCase().includes("accept");

  if (!hasDraftPayload && !looksLikeFullPost) {
    return visible;
  }

  for (const pattern of DRAFT_INTRO_PATTERNS) {
    visible = visible.replace(pattern, "").trim();
  }
  visible = dedupeRepeatedLines(visible);

  const reviewSuffix = CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE;
  if (!visible || visible.length < 24 || looksLikeFullPost) {
    const firstShortLine = visible
      .split("\n")
      .find(l => l.trim().length > 0 && l.trim().length <= 120)
      ?.trim();
    if (firstShortLine && !looksLikeFullPost) {
      return `${firstShortLine}\n\n${reviewSuffix}`;
    }
    return `Please review your updated LinkedIn post draft in Studio.\n\n${reviewSuffix}`;
  }

  if (visible.includes(reviewSuffix)) {
    return visible;
  }

  return `${visible}\n\n${reviewSuffix}`;
};
