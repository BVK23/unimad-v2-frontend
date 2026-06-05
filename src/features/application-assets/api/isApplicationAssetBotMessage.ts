import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";

/** True when bot output is an application-asset draft (not a LinkedIn post). */
export const isApplicationAssetBotMessage = (botMessage: string): boolean => {
  const payload = extractApplicationAssetDraftPayload(botMessage);
  if (payload.assetType) {
    return payload.draft.length > 0;
  }
  if (!payload.draft || payload.draft.length < 40) {
    return false;
  }
  if (payload.role && payload.company) {
    return true;
  }
  const lower = botMessage.toLowerCase();
  return (
    lower.includes("cover letter") ||
    lower.includes("coverletter") ||
    lower.includes("cold email") ||
    lower.includes("coldemail") ||
    lower.includes("referral request") ||
    /\breferral\b/.test(lower) ||
    lower.includes('"asset_type"')
  );
};
