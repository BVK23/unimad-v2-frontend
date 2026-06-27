import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

const DRAFT_INTRO_PATTERNS = [
  /here'?s (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /here is (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve (written|created|generated|updated) (a )?draft[^.!?\n]*[.!?]?/gi,
];

const TOOL_NARRATION_PATTERNS = [
  /`get_application_asset_draft`[^\n]*/gi,
  /`update_application_asset_draft`[^\n]*/gi,
  /`body`[^\n]*/gi,
  /the `body` from[^\n]*/gi,
  /^the current correct base[^\n]*$/gim,
  /^now, the user wants[^\n]*$/gim,
  /^proposed new section[^\n]*$/gim,
  /^i will use the corrected state[^\n]*$/gim,
];

const MAX_KEEP_VISIBLE_CHARS = 180;

const looksLikeUserFacingSentence = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_KEEP_VISIBLE_CHARS) {
    return false;
  }
  const lineCount = trimmed.split(/\n+/).filter(Boolean).length;
  if (lineCount > 2) {
    return false;
  }
  if (/^(dear |to whom|sap hiring|hiring team)/i.test(trimmed)) {
    return false;
  }
  if (trimmed.includes("```") || trimmed.includes('"data"')) {
    return false;
  }
  return true;
};

const stripToolNarrationFromMessage = (text: string): string =>
  TOOL_NARRATION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, "").trim(), text)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const applicationAssetDraftReviewMessage = (assetType?: ApplicationAssetApiType | null): string => {
  switch (assetType) {
    case "coverletter":
      return "I've updated your cover letter draft. Please review the edit in Studio, then accept or discard below.";
    case "coldemail":
      return "I've updated your cold email draft. Please review the edit in Studio, then accept or discard below.";
    case "referral":
      return "I've updated your referral request draft. Please review the edit in Studio, then accept or discard below.";
    default:
      return "I've updated your application draft. Please review the edit in Studio, then accept or discard below.";
  }
};

export const messageHasApplicationAssetDraft = (botMessage: string): boolean => {
  if (!isApplicationAssetBotMessage(botMessage)) {
    return false;
  }
  return extractApplicationAssetDraftPayload(botMessage).draft.length >= APPLICATION_ASSET_MIN_DRAFT_CHARS;
};

/** Hide machine-readable draft JSON and use review-oriented copy in chat bubbles. */
export const stripApplicationAssetDraftFromMessage = (botMessage: string): string => {
  if (!messageHasApplicationAssetDraft(botMessage)) {
    return stripMachineReadablePayloadFromMessage(botMessage);
  }

  const payload = extractApplicationAssetDraftPayload(botMessage);
  const reviewLine = applicationAssetDraftReviewMessage(payload.assetType);

  let visible = stripMachineReadablePayloadFromMessage(botMessage);
  for (const pattern of DRAFT_INTRO_PATTERNS) {
    visible = visible.replace(pattern, "").trim();
  }
  visible = stripToolNarrationFromMessage(visible);

  if (!visible) {
    return reviewLine;
  }

  if (visible.toLowerCase().includes(reviewLine.toLowerCase().slice(0, 24))) {
    return visible.length <= MAX_KEEP_VISIBLE_CHARS ? visible : reviewLine;
  }

  if (looksLikeUserFacingSentence(visible)) {
    return visible;
  }

  return reviewLine;
};
