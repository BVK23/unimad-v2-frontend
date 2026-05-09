import { extractContentGenDraftFromBotMessage } from "@/features/content-lab/api/extractContentGenDraft";
import type { UnibotChatMessage } from "@/features/content-lab/types";

/**
 * First bot turn after `generate-asset/contentgen` holds the draft (JSON `data` string).
 */
export const getFirstContentGenDraftFromHistory = (chatHistory: UnibotChatMessage[]): string => {
  const firstBot = chatHistory.find(m => m.type === "bot");
  if (!firstBot?.message) {
    return "";
  }
  return extractContentGenDraftFromBotMessage(firstBot.message);
};
