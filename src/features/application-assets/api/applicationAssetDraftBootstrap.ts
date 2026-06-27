import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ApplicationAssetProfileSnapshot } from "@/features/application-assets/utils/applicationAssetProfileSnapshot";
import { formatCoverLetterDate } from "@/features/application-assets/utils/formatCoverLetterDate";
import type { UnibotAdkSessionRow } from "@/src/features/adk-chat/session-registry";
import {
  buildStudioAssetDraftSubtitle,
  buildStudioAssetDraftTitle,
  buildStudioAssetImproveTitle,
  deriveSubSessionSubtitle,
} from "@/src/features/adk-chat/sub-session-titles";

const LABELS: Record<ApplicationAssetApiType, string> = {
  coverletter: "Cover letter",
  coldemail: "Cold email",
  referral: "Referral",
};

const MAX_JD_CHARS = 6000;

export type BuildApplicationAssetDraftBootstrapOptions = {
  /** When true, job context is already in session — embed JSON context for single-pass Studio ADK. */
  studioHeadless?: boolean;
  profileSnapshot?: ApplicationAssetProfileSnapshot;
  /** Generate Another: fresh draft for the same asset (not a light edit). */
  regenerateAnother?: boolean;
};

export const buildApplicationAssetDraftBootstrap = (
  assetType: ApplicationAssetApiType,
  role: string,
  company: string,
  jobDescription: string,
  contactName?: string,
  options?: BuildApplicationAssetDraftBootstrapOptions
): string => {
  const label = LABELS[assetType];

  if (options?.regenerateAnother) {
    const contact = contactName?.trim();
    const parts = [
      `Generate a fresh alternative ${label.toLowerCase()} draft for the same role and company.`,
      "Create a completely new version — not a light edit of the current draft.",
      role ? `Role: ${role}.` : "",
      company ? `Company: ${company}.` : "",
      jobDescription ? `Job description: ${jobDescription.slice(0, 2000)}.` : "",
      contact ? `Contact: ${contact}.` : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  if (options?.studioHeadless) {
    const contact = contactName?.trim();
    const payload = {
      task: `write_${assetType}_draft`,
      asset_type: assetType,
      role: role.trim(),
      company: company.trim(),
      job_description: jobDescription.trim().slice(0, MAX_JD_CHARS),
      contact_name: contact || "",
      current_date: assetType === "coverletter" ? formatCoverLetterDate() : undefined,
      profile_snapshot: options.profileSnapshot ?? {},
    };
    return JSON.stringify(payload);
  }

  const parts = [
    `Write the full ${label.toLowerCase()} draft.`,
    role ? `Role: ${role}.` : "",
    company ? `Company: ${company}.` : "",
    jobDescription ? `Job description: ${jobDescription.slice(0, 2000)}.` : "",
    contactName ? `Contact: ${contactName}.` : "",
  ].filter(Boolean);
  return parts.join(" ");
};

export const applicationAssetTopicTitle = (
  assetType: ApplicationAssetApiType,
  company: string,
  role: string,
  assetId?: string | null
): string => {
  return buildStudioAssetDraftTitle(assetType, assetId);
};

export const applicationAssetTopicSubtitle = (company: string, role: string): string | undefined => {
  return buildStudioAssetDraftSubtitle(company, role);
};

export const resolveApplicationAssetTopicDisplaySubtitle = (params: {
  topicSubtitle?: string;
  subRow?: Pick<UnibotAdkSessionRow, "feature" | "section" | "feature_id" | "entry_id" | "content_key">;
  studioRole?: string;
  studioCompany?: string;
  studioAssetId?: string | null;
}): string | undefined => {
  const stored = params.topicSubtitle?.trim();
  if (stored) return stored;
  if (params.subRow) {
    const fromRegistry = deriveSubSessionSubtitle(params.subRow);
    if (fromRegistry) return fromRegistry;
    const fid = (params.subRow.feature_id ?? "").trim();
    if (/^\d+$/.test(fid) && params.studioAssetId?.trim() === fid) {
      return applicationAssetTopicSubtitle(params.studioCompany ?? "", params.studioRole ?? "");
    }
  }
  return undefined;
};

export const applicationAssetImproveTopicTitle = (assetType: ApplicationAssetApiType, assetId?: string | null): string => {
  return buildStudioAssetImproveTitle(assetType, assetId);
};
