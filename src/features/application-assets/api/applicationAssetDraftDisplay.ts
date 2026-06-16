import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import { isApplicationAssetBotMessage } from "@/features/application-assets/api/isApplicationAssetBotMessage";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

const DRAFT_INTRO_PATTERNS = [
  /here'?s (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /here is (a )?(first |another )?draft[^.!?\n]*[.!?]?/gi,
  /i'?ve (written|created|generated) (a )?draft[^.!?\n]*[.!?]?/gi,
];

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
  let visible = stripMachineReadablePayloadFromMessage(botMessage);

  if (!messageHasApplicationAssetDraft(botMessage)) {
    return visible;
  }

  const payload = extractApplicationAssetDraftPayload(botMessage);
  const reviewLine = applicationAssetDraftReviewMessage(payload.assetType);

  for (const pattern of DRAFT_INTRO_PATTERNS) {
    visible = visible.replace(pattern, "").trim();
  }

  if (!visible || visible.length < 24) {
    return reviewLine;
  }

  if (visible.toLowerCase().includes(reviewLine.toLowerCase().slice(0, 24))) {
    return visible;
  }

  return `${visible}\n\n${reviewLine}`;
};
