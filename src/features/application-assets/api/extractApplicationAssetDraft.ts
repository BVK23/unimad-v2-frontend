import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { formatCoverLetterDate, normalizeCoverLetterDatePlaceholders } from "@/features/application-assets/utils/formatCoverLetterDate";

export type ApplicationAssetDraftPayload = {
  draft: string;
  assetType?: ApplicationAssetApiType;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
};

const JSON_FENCE_GLOBAL_REGEX = /```\s*json\s*([\s\S]*?)```/gi;
const INLINE_DRAFT_JSON_REGEX = /\{\s*"data"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;

const VALID_TYPES = new Set<ApplicationAssetApiType>(["coverletter", "coldemail", "referral"]);

const formatDraftString = (s: string): string =>
  s
    .replace(/^\s*\*\s+/gm, "* ")
    .replace(/([^\n])\n(?!\n)/g, "$1  \n")
    .trim();

const cleanJsonPayload = (raw: string): string =>
  raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\\(\r\n|\n|\r)/g, "\\n")
    .trim();

const mergePayload = (current: ApplicationAssetDraftPayload, candidate: ApplicationAssetDraftPayload): ApplicationAssetDraftPayload => ({
  draft: candidate.draft.length > current.draft.length ? candidate.draft : current.draft,
  assetType: candidate.assetType ?? current.assetType,
  role: candidate.role?.trim() || current.role,
  company: candidate.company?.trim() || current.company,
  jobDescription: candidate.jobDescription?.trim() || current.jobDescription,
  contactName: candidate.contactName?.trim() || current.contactName,
});

const payloadFromParsedObject = (parsed: Record<string, unknown>): ApplicationAssetDraftPayload | null => {
  const dataValue = parsed.data;
  if (typeof dataValue !== "string") {
    return null;
  }
  const rawType = typeof parsed.asset_type === "string" ? parsed.asset_type.trim() : "";
  const assetType = VALID_TYPES.has(rawType as ApplicationAssetApiType) ? (rawType as ApplicationAssetApiType) : undefined;
  let draft = formatDraftString(dataValue);
  if (assetType === "coverletter") {
    draft = normalizeCoverLetterDatePlaceholders(draft, formatCoverLetterDate());
  }
  if (!draft) {
    return null;
  }
  const role = typeof parsed.role === "string" ? parsed.role.trim() : undefined;
  const company = typeof parsed.company === "string" ? parsed.company.trim() : undefined;
  const jobDescription =
    typeof parsed.job_description === "string"
      ? parsed.job_description.trim()
      : typeof parsed.jd === "string"
        ? parsed.jd.trim()
        : undefined;
  const contactName =
    typeof parsed.contact_name === "string"
      ? parsed.contact_name.trim()
      : typeof parsed.hirname === "string"
        ? parsed.hirname.trim()
        : typeof parsed.conname === "string"
          ? parsed.conname.trim()
          : undefined;

  return { draft, assetType, role, company, jobDescription, contactName };
};

export const extractApplicationAssetDraftPayload = (botMessage: string): ApplicationAssetDraftPayload => {
  let best: ApplicationAssetDraftPayload = { draft: "" };

  INLINE_DRAFT_JSON_REGEX.lastIndex = 0;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = INLINE_DRAFT_JSON_REGEX.exec(botMessage)) !== null) {
    try {
      const unescaped = inlineMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      best = mergePayload(best, { draft: formatDraftString(unescaped) });
    } catch {
      // continue
    }
  }

  JSON_FENCE_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_GLOBAL_REGEX.exec(botMessage)) !== null) {
    try {
      const parsed = JSON.parse(cleanJsonPayload(match[1])) as Record<string, unknown>;
      const candidate = payloadFromParsedObject(parsed);
      if (candidate) {
        best = mergePayload(best, candidate);
      }
    } catch {
      const dataMatch = match[1].match(/"data"\s*:\s*"([\s\S]*)"\s*}/);
      if (dataMatch?.[1]) {
        const unescaped = dataMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        best = mergePayload(best, { draft: formatDraftString(unescaped) });
      }
    }
  }

  return best;
};

export const extractApplicationAssetDraftFromBotMessage = (botMessage: string): string =>
  extractApplicationAssetDraftPayload(botMessage).draft;
