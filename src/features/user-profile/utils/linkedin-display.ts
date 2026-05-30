import type { LinkedInStoredData } from "../types";

export type LinkedInExperienceItem = {
  title: string;
  company: string;
  description: string;
  isCurrent: boolean;
  duration?: string;
};

export function parseLinkedInExperience(raw: unknown): LinkedInExperienceItem[] {
  if (!Array.isArray(raw)) return [];
  const items: LinkedInExperienceItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const title = String(item.title ?? item.position ?? item.job_title ?? "").trim();
    const company = String(item.company ?? item.company_name ?? item.companyName ?? "").trim();
    const description = String(item.description ?? item.summary ?? "").trim();
    const isCurrent = Boolean(item.is_current ?? item.current ?? item.is_present);
    const duration = String(item.duration ?? item.date_range ?? item.dates ?? "").trim() || undefined;
    if (!title && !company && !description) continue;
    items.push({ title, company, description, isCurrent, duration });
  }
  return items;
}

export function parseLinkedInSkills(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) {
      names.push(entry.trim());
    } else if (entry && typeof entry === "object") {
      const item = entry as Record<string, unknown>;
      const name = item.name ?? item.skill ?? item.title;
      if (typeof name === "string" && name.trim()) names.push(name.trim());
    }
  }
  return names;
}

export function hasLinkedInStoredData(li: LinkedInStoredData | null | undefined): boolean {
  if (!li) return false;
  return Boolean(
    li.display_name ||
    li.headline ||
    li.about ||
    li.profile_url ||
    li.profile_picture_url ||
    parseLinkedInExperience(li.experience).length ||
    parseLinkedInSkills(li.skills).length
  );
}
