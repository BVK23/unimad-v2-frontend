import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { exportContentAsPDF } from "@/utils/pdf-export";

const sanitizeForFilename = (value: string | number | undefined | null) => {
  if (!value) return "";
  const str = String(value);
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const exportCoverLetterAsPDF = async (asset: CoverLetterAsset) => {
  const content = asset.content ?? "";
  const trimmed = content.trim();
  if (!trimmed) return;

  const roleSlug = sanitizeForFilename(asset.role);
  const companySlug = sanitizeForFilename(asset.company);
  const idSlug = sanitizeForFilename(asset.id);

  const parts = ["cover-letter"];
  if (roleSlug) parts.push(roleSlug);
  if (companySlug) parts.push(companySlug);
  if (!roleSlug && !companySlug && idSlug) parts.push(idSlug);

  const filename = `${parts.join("-") || "cover-letter"}.pdf`;

  await exportContentAsPDF(trimmed, filename);
};
