import { exportContentAsDocx } from "@/utils/export-content-docx";
import { exportContentAsPDF } from "@/utils/pdf-export";

const sanitizeForFilename = (value: string | undefined | null) => {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function buildApplicationAssetFilename(kind: "cover-letter" | "cold-email", company: string, role?: string, ext = "pdf") {
  const parts: string[] = [kind];
  const roleSlug = sanitizeForFilename(role);
  const companySlug = sanitizeForFilename(company);
  if (roleSlug) parts.push(roleSlug);
  if (companySlug) parts.push(companySlug);
  return `${parts.join("-") || kind}.${ext}`;
}

export async function exportApplicationAssetAsPdf(content: string, kind: "cover-letter" | "cold-email", company: string, role?: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  await exportContentAsPDF(trimmed, buildApplicationAssetFilename(kind, company, role, "pdf"));
}

export async function exportApplicationAssetAsDocx(content: string, kind: "cover-letter" | "cold-email", company: string, role?: string) {
  const trimmed = content.trim();
  if (!trimmed) return;
  await exportContentAsDocx(trimmed, buildApplicationAssetFilename(kind, company, role, "docx"));
}
