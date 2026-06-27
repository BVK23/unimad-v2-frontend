import type { ColdEmailAsset } from "@/features/cold-email/types";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import type { ReferralAsset } from "@/features/referral/types";
import { normalizeContactNameForDisplay } from "@/utils/normalizeContactName";
import type { DocumentLibraryItem } from "./documentLibraryTypes";

const assetSortTimestamp = (updatedAt?: string | null, createdAt?: string | null, sentAt?: string | null): number => {
  const raw = updatedAt ?? createdAt ?? sentAt;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

export const sortApplicationAssetsByRecency = <
  T extends { updated_at?: string | null; created_at?: string | null; dateSent?: string | null },
>(
  assets: T[]
): T[] =>
  [...assets].sort(
    (a, b) => assetSortTimestamp(b.updated_at, b.created_at, b.dateSent) - assetSortTimestamp(a.updated_at, a.created_at, a.dateSent)
  );

const formatRelativeDate = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
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

export const mapColdEmailToDocumentItem = (asset: ColdEmailAsset & { contact_name?: string }): DocumentLibraryItem => ({
  id: asset.id,
  topic: "cold-email",
  kind: "recent",
  title: assetTitle(asset.role, asset.company),
  date: formatRelativeDate(asset.updated_at ?? asset.created_at),
  content: asset.content ?? "",
  status: assetDraftStatus(typeof asset.status === "string" ? asset.status : undefined),
  contactName: normalizeContactNameForDisplay(asset.hirname ?? asset.managerName ?? asset.contact_name),
});

export const mapReferralToDocumentItem = (asset: ReferralAsset & { contact_name?: string }): DocumentLibraryItem => ({
  id: asset.id,
  topic: "referral",
  kind: asset.dateSent ? "history" : "recent",
  title: assetTitle(asset.role, asset.company),
  date: formatRelativeDate(asset.dateSent ?? asset.updated_at ?? asset.created_at),
  content: asset.content ?? "",
  status: asset.dateSent ? "Sent" : assetDraftStatus(asset.status === "draft" || asset.status === "accepted" ? asset.status : undefined),
  contactName: normalizeContactNameForDisplay(asset.conname ?? asset.contact_name),
});
