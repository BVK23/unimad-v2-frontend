import type { ResumeData } from "@/types";

/** True when backend has marked this resume as published (`published_at` set). */
export function isResumePublished(resume: Pick<ResumeData, "publishedAt">): boolean {
  return Boolean(resume.publishedAt?.trim());
}

export function getResumePublicSlug(resume: Pick<ResumeData, "slug" | "publishedAt">): string | null {
  if (!isResumePublished(resume)) return null;
  const slug = resume.slug?.trim();
  return slug || null;
}

export function buildResumePublicUrl(slug: string): string {
  const trimmed = slug.trim();
  if (typeof window !== "undefined") {
    return `${window.location.origin}/resume/${encodeURIComponent(trimmed)}`;
  }
  return `/resume/${encodeURIComponent(trimmed)}`;
}

export async function copyResumePublicLink(resume: Pick<ResumeData, "slug" | "publishedAt">): Promise<boolean> {
  const slug = getResumePublicSlug(resume);
  if (!slug) return false;
  try {
    await navigator.clipboard.writeText(buildResumePublicUrl(slug));
    return true;
  } catch {
    return false;
  }
}
