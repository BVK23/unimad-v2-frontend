import type { LinkedInAnalysisSnapshot } from "@/features/linkedin/types";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";
import type { ProfileData } from "../types";
import { parseLinkedInExperience } from "./linkedin-display";

export type LinkedInPostAuthorDisplay = {
  name: string;
  headline: string;
  pictureUrls: string[];
  initials: string;
};

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function hasLinkedInOptimization(profile: ProfileData | null | undefined, snapshot?: LinkedInAnalysisSnapshot | null): boolean {
  if (snapshot?.hasAnalysis) return true;
  return Boolean(profile?.linkedin_stored_data?.analyzed_at);
}

export function formatLinkedInStyleName(firstName: string, lastName: string): string {
  const first = trim(firstName);
  const last = trim(lastName);
  if (!first && !last) return "You";
  if (!first) return last;
  if (!last) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

function splitNameParts(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

export function resolveLinkedInPostAuthorName(profile: ProfileData | null | undefined): string {
  const onboarding = profile?.onboarding_data;
  let firstName = trim(onboarding?.first_name);
  let lastName = trim(onboarding?.last_name);

  if (!firstName || !lastName) {
    const linkedinName = trim(profile?.linkedin_stored_data?.display_name);
    if (linkedinName) {
      const parsed = splitNameParts(linkedinName);
      firstName = firstName || parsed.firstName;
      lastName = lastName || parsed.lastName;
    }
  }

  if (!firstName || !lastName) {
    const preferred = trim(profile?.name);
    if (preferred) {
      const parsed = splitNameParts(preferred);
      firstName = firstName || parsed.firstName;
      lastName = lastName || parsed.lastName;
    }
  }

  return formatLinkedInStyleName(firstName, lastName);
}

function pickRecentExperienceHeadline(profile: ProfileData | null | undefined): string {
  const experiences = profile?.experiences ?? [];
  const current =
    experiences.find(entry => trim(entry.endDate) === "Present") ??
    experiences.find(entry => trim(entry.role) || trim(entry.organisation)) ??
    null;

  if (current) {
    const role = trim(current.role);
    const organisation = trim(current.organisation);
    if (role && organisation) return `${role} @ ${organisation}`;
    return role || organisation;
  }

  const linkedInExperience = parseLinkedInExperience(profile?.linkedin_stored_data?.experience);
  const linkedInCurrent = linkedInExperience.find(entry => entry.isCurrent) ?? linkedInExperience[0];
  if (linkedInCurrent) {
    if (linkedInCurrent.title && linkedInCurrent.company) {
      return `${linkedInCurrent.title} @ ${linkedInCurrent.company}`;
    }
    return linkedInCurrent.title || linkedInCurrent.company;
  }

  return "Professional";
}

export function resolveLinkedInPostAuthorHeadline(
  profile: ProfileData | null | undefined,
  snapshot?: LinkedInAnalysisSnapshot | null
): string {
  if (hasLinkedInOptimization(profile, snapshot)) {
    const linkedInHeadline = trim(profile?.linkedin_stored_data?.headline);
    if (linkedInHeadline) return linkedInHeadline;

    const snapshotHeadline = trim(snapshot?.profileContent?.headline);
    if (snapshotHeadline) return snapshotHeadline;
  }

  const profileHeadline = trim(profile?.headline);
  if (profileHeadline) return profileHeadline;

  return pickRecentExperienceHeadline(profile);
}

/** LinkedIn post preview prefers LinkedIn → Unimad → Google (not the menu avatar order). */
export function resolveLinkedInPostAuthorPictureCandidates(
  profile: ProfileData | null | undefined,
  snapshot?: LinkedInAnalysisSnapshot | null
): string[] {
  const sources = profile?.profilePictureSources;
  const candidates = [
    sources?.linkedin,
    profile?.linkedin_stored_data?.profile_picture_url,
    snapshot?.profileContent?.profilePictureUrl,
    snapshot?.result?.profilePictureUrl,
    sources?.unimad,
    sources?.google,
  ];

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const candidate of candidates) {
    const raw = trim(candidate);
    if (!raw) continue;
    const resolved = resolveMediaDisplayUrl(raw);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    urls.push(raw);
  }
  return urls;
}

/** @deprecated Prefer `resolveLinkedInPostAuthorPictureCandidates` for fallback-aware UIs. */
export function resolveLinkedInPostAuthorPicture(
  profile: ProfileData | null | undefined,
  snapshot?: LinkedInAnalysisSnapshot | null
): string | null {
  return resolveLinkedInPostAuthorPictureCandidates(profile, snapshot)[0] ?? null;
}

export function linkedInPostAuthorInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function resolveLinkedInPostAuthorDisplay(
  profile: ProfileData | null | undefined,
  snapshot?: LinkedInAnalysisSnapshot | null
): LinkedInPostAuthorDisplay {
  const name = resolveLinkedInPostAuthorName(profile);
  return {
    name,
    headline: resolveLinkedInPostAuthorHeadline(profile, snapshot),
    pictureUrls: resolveLinkedInPostAuthorPictureCandidates(profile, snapshot),
    initials: linkedInPostAuthorInitials(name),
  };
}
