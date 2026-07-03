import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { extractContentGenDraftFromBotMessage } from "@/features/content-lab/api/extractContentGenDraft";

const DRAFT_INTRO_PATTERNS = [
  /here'?s (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /here is (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve (written|created|generated) (a )?(first )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve created the first draft[^.!?\n]*[.!?]?/gi,
];

const PIPELINE_LEAK_PATTERNS = [
  /word count\s*:/i,
  /\blines\s*:\s*\d+/i,
  /update_post_draft/i,
  /get_post_draft/i,
  /\bnow i will call\b/i,
  /this draft meets the requirements/i,
];

/** Short premature status lines from pipeline agents before the formatter runs. */
const PREMATURE_DRAFT_STATUS_PATTERNS = [
  /draft has been created/i,
  /post draft has been created/i,
  /linkedin post draft has been created/i,
  /i'?ve created the (first )?draft/i,
  /draft is ready/i,
  /draft has been generated/i,
];

const REVIEW_LINE_PATTERN = /accept or improve|review (it )?in studio|please review|review your .* draft/i;

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

const isPrematureDraftStatusMessage = (visible: string): boolean => PREMATURE_DRAFT_STATUS_PATTERNS.some(p => p.test(visible));

const shouldCollapseContentGenDraftBubble = (visible: string, hasDraftPayload: boolean, draftTurn?: boolean): boolean => {
  if (hasDraftPayload) return true;
  if (PIPELINE_LEAK_PATTERNS.some(p => p.test(visible))) return true;
  if (draftTurn && isPrematureDraftStatusMessage(visible)) return true;
  const lines = visible
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const hasReviewFooter = lines.some(l => REVIEW_LINE_PATTERN.test(l));
  if (hasReviewFooter && visible.length >= CONTENT_GEN_MIN_DRAFT_CHARS) return true;
  if (draftTurn && visible.length >= CONTENT_GEN_MIN_DRAFT_CHARS) return true;
  return false;
};

/** While ADK first-draft pipeline SSE is in flight, keep activity labels — not partial agent text. */
export const shouldDeferContentGenDraftBubbleText = (options: {
  draftThread: boolean;
  agentLoading: boolean;
  isActiveStreamMessage: boolean;
}): boolean => options.draftThread && options.agentLoading && options.isActiveStreamMessage;

const extractReviewSummaryLines = (visible: string): string[] => {
  const lines = visible
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  const picked: string[] = [];
  for (const line of lines) {
    if (line.length > 160) continue;
    const matchesIntro = DRAFT_INTRO_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
    if (matchesIntro || REVIEW_LINE_PATTERN.test(line)) {
      picked.push(line);
    }
  }
  return dedupeRepeatedLines(picked.join("\n"))
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
};

/** Hide machine-readable draft JSON and leaked session-draft prose from chat bubbles. */
export const stripContentGenDraftFromMessage = (botMessage: string, options?: { draftTurn?: boolean }): string => {
  let visible = stripMachineReadablePayloadFromMessage(botMessage);
  visible = dedupeRepeatedLines(visible);

  if (isApplicationAssetBotMessage(botMessage)) {
    return visible;
  }

  const hasDraftPayload = messageHasContentGenDraft(botMessage);
  if (!shouldCollapseContentGenDraftBubble(visible, hasDraftPayload, options?.draftTurn)) {
    return visible;
  }

  for (const pattern of DRAFT_INTRO_PATTERNS) {
    pattern.lastIndex = 0;
    visible = visible.replace(pattern, "").trim();
  }

  const reviewLines = extractReviewSummaryLines(visible);
  if (reviewLines.length > 0) {
    visible = reviewLines.join("\n");
  } else {
    visible = "";
  }
  visible = dedupeRepeatedLines(visible);

  const reviewSuffix = CONTENT_GEN_DRAFT_REVIEW_USER_MESSAGE;
  if (!visible || visible.length < 24) {
    return `Please review your updated LinkedIn post draft in Studio.\n\n${reviewSuffix}`;
  }

  if (visible.includes(reviewSuffix)) {
    return visible;
  }

  return `${visible}\n\n${reviewSuffix}`;
};
