import { extractApplicationAssetDraftPayload } from "@/features/application-assets/api/extractApplicationAssetDraft";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";

type ThreadMessageLike = {
  id?: string;
  role: string;
  text?: string;
};

export type ResolvedApplicationAssetContext = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName: string;
};

const inferAssetTypeFromText = (text: string): ApplicationAssetApiType | null => {
  const lower = text.toLowerCase();
  if (/\bcover\s*letter\b/.test(lower) || /\bcoverletter\b/.test(lower)) {
    return "coverletter";
  }
  if (/\bcold\s*email\b/.test(lower) || /\bcoldemail\b/.test(lower)) {
    return "coldemail";
  }
  if (/\breferral\b/.test(lower)) {
    return "referral";
  }
  return null;
};

const getLastUserMessageBefore = (messages: ThreadMessageLike[] | undefined, beforeMessageId?: string): string | null => {
  if (!messages?.length) {
    return null;
  }
  const endIdx = beforeMessageId
    ? Math.max(
        0,
        messages.findIndex(m => m.id === beforeMessageId)
      )
    : messages.length;
  for (let i = endIdx - 1; i >= 0; i--) {
    const text = messages[i]?.text?.trim() ?? "";
    if (messages[i]?.role === "user" && text) {
      return text;
    }
  }
  return null;
};

const parseRoleCompanyFromUserText = (text: string): { role: string; company: string } => {
  const atMatch = text.match(/(?:for|as)\s+(?:a\s+)?(.+?)\s+(?:role\s+)?(?:at|@)\s+([A-Za-z0-9][A-Za-z0-9\s&.'-]{1,80})/i);
  if (atMatch) {
    return { role: atMatch[1].trim(), company: atMatch[2].trim().replace(/\.\s*$/, "") };
  }
  return { role: "", company: "" };
};

const parseJobDescriptionFromUserText = (text: string): string => {
  const jdMatch = text.match(/(?:here'?s?\s+(?:the\s+)?jd|job\s+description)\s*:?\s*([\s\S]+)/i);
  return jdMatch?.[1]?.trim().slice(0, 8000) ?? "";
};

const parseContactNameFromUserText = (text: string, assetType: ApplicationAssetApiType): string => {
  if (assetType === "coldemail") {
    const toMatch = text.match(/\b(?:cold\s*email|email)\s+to\s+((?:Mr\.|Mrs\.|Ms\.|Dr\.)?\s*[A-Za-z][A-Za-z\s.'-]{0,60}?)\s+for\b/i);
    if (toMatch?.[1]) {
      return toMatch[1].trim();
    }
    const genericToMatch = text.match(/\bto\s+((?:Mr\.|Mrs\.|Ms\.|Dr\.)?\s*[A-Za-z][A-Za-z\s.'-]{0,60}?)\s+for\b/i);
    return genericToMatch?.[1]?.trim() ?? "";
  }
  if (assetType === "referral") {
    const toMatch = text.match(/\b(?:referral|refer)\s+(?:request\s+)?to\s+([A-Za-z][A-Za-z\s.'-]{0,60}?)(?:\s+for|\s+about|,|$)/i);
    return toMatch?.[1]?.trim() ?? "";
  }
  return "";
};

export const resolveApplicationAssetDraftContext = (params: {
  botMessage: string;
  assetTypeOverride?: ApplicationAssetApiType | null;
  studioAssetType?: ApplicationAssetApiType | null;
  studioRole?: string;
  studioCompany?: string;
  studioJobDescription?: string;
  studioContactName?: string;
  threadMessages?: ThreadMessageLike[];
  beforeMessageId?: string;
  /** Session GET path: draft comes from ADK state, not chat prose. */
  sessionDraftOverride?: string;
}): ResolvedApplicationAssetContext | null => {
  const payload = extractApplicationAssetDraftPayload(params.botMessage);
  const sessionDraft = params.sessionDraftOverride?.trim() ?? "";
  const hasBotDraft = payload.draft.length >= 40;

  if (!hasBotDraft && sessionDraft.length >= 40) {
    const assetType = params.assetTypeOverride ?? params.studioAssetType ?? null;
    if (!assetType) {
      return null;
    }
    return {
      assetType,
      role: params.studioRole?.trim() || "",
      company: params.studioCompany?.trim() || "",
      jobDescription: params.studioJobDescription?.trim() || "",
      contactName: params.studioContactName?.trim() || "",
    };
  }

  if (!hasBotDraft) {
    return null;
  }

  const userText = getLastUserMessageBefore(params.threadMessages, params.beforeMessageId) ?? "";
  const fromUser = parseRoleCompanyFromUserText(userText);
  const fromUserJd = parseJobDescriptionFromUserText(userText);

  const assetType =
    params.assetTypeOverride ??
    payload.assetType ??
    params.studioAssetType ??
    inferAssetTypeFromText(userText) ??
    inferAssetTypeFromText(params.botMessage) ??
    null;

  if (!assetType) {
    return null;
  }

  const fromUserContact = parseContactNameFromUserText(userText, assetType);

  const role = payload.role?.trim() || fromUser.role || params.studioRole?.trim() || "";
  const company = payload.company?.trim() || fromUser.company || params.studioCompany?.trim() || "";
  const jobDescription =
    (typeof payload.jobDescription === "string" ? payload.jobDescription.trim() : "") ||
    fromUserJd ||
    params.studioJobDescription?.trim() ||
    "";

  const contactName = payload.contactName?.trim() || fromUserContact || params.studioContactName?.trim() || "";

  return { assetType, role, company, jobDescription, contactName };
};
