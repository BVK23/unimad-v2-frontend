import type { ColdEmailAsset } from "@/features/cold-email/types";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import type { ReferralAsset } from "@/features/referral/types";
import type { DocumentLibraryItem } from "./documentLibraryTypes";

const formatRelativeDate = (iso?: string | null): string => {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
};

const assetTitle = (role?: string, company?: string) => (role && company ? `${role} @ ${company}` : role || company || "Untitled draft");

const assetDraftStatus = (status?: string): DocumentLibraryItem["status"] => (status === "draft" ? "Draft" : undefined);

export const mapCoverLetterToDocumentItem = (asset: CoverLetterAsset): DocumentLibraryItem => ({
  id: asset.id,
  topic: "cover-letter",
  kind: "recent",
  title: assetTitle(asset.role, asset.company),
  date: formatRelativeDate(asset.updated_at ?? asset.created_at),
  content: asset.content ?? "",
  status: assetDraftStatus(asset.status),
});

export const mapColdEmailToDocumentItem = (asset: ColdEmailAsset): DocumentLibraryItem => ({
  id: asset.id,
  topic: "cold-email",
  kind: "recent",
  title: assetTitle(asset.role, asset.company),
  date: formatRelativeDate(asset.updated_at ?? asset.created_at),
  content: asset.content ?? "",
  status: assetDraftStatus(typeof asset.status === "string" ? asset.status : undefined),
});

export const mapReferralToDocumentItem = (asset: ReferralAsset): DocumentLibraryItem => ({
  id: asset.id,
  topic: "referral",
  kind: asset.dateSent ? "history" : "recent",
  title: assetTitle(asset.role, asset.company),
  date: formatRelativeDate(asset.dateSent ?? asset.updated_at ?? asset.created_at),
  content: asset.content ?? "",
  status: asset.dateSent ? "Sent" : assetDraftStatus(asset.status === "draft" || asset.status === "accepted" ? asset.status : undefined),
});
