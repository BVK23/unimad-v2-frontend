import type { ApplicationAssetApiType } from "@/features/application-assets/types";

const LABELS: Record<ApplicationAssetApiType, string> = {
  coverletter: "Cover letter",
  coldemail: "Cold email",
  referral: "Referral",
};

export const buildApplicationAssetDraftBootstrap = (
  assetType: ApplicationAssetApiType,
  role: string,
  company: string,
  jobDescription: string,
  contactName?: string
): string => {
  const label = LABELS[assetType];
  const parts = [
    `Write the full ${label.toLowerCase()} draft.`,
    role ? `Role: ${role}.` : "",
    company ? `Company: ${company}.` : "",
    jobDescription ? `Job description: ${jobDescription.slice(0, 2000)}.` : "",
    contactName ? `Contact: ${contactName}.` : "",
  ].filter(Boolean);
  return parts.join(" ");
};

export const applicationAssetTopicTitle = (assetType: ApplicationAssetApiType, company: string, role: string): string => {
  const label = LABELS[assetType];
  if (company && role) {
    return `${label} · ${company} · ${role}`;
  }
  if (company) {
    return `${label} · ${company}`;
  }
  return label;
};
