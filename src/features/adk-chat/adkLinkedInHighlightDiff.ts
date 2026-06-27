import type { LinkedInSessionProfile } from "@/src/features/linkedin/api/adk-mappers";

export type LinkedInHighlightSection = "headline" | "about" | "exp" | "skills" | "connection" | "comment";

export type LinkedInHighlightMap = Partial<Record<LinkedInHighlightSection, "modified">>;

export const EMPTY_LINKEDIN_HIGHLIGHT_MAP: LinkedInHighlightMap = {};

const SECTION_LABELS: Record<LinkedInHighlightSection, string> = {
  headline: "Headline",
  about: "About section",
  exp: "Experience",
  skills: "Skills",
  connection: "Connection request",
  comment: "Comment draft",
};

function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function connectionSig(draft: LinkedInSessionProfile["connection_draft"]): string {
  return stableJson(draft);
}

function commentSig(draft: LinkedInSessionProfile["comment_draft"]): string {
  return stableJson(draft);
}

export function deriveLinkedInBannerTitle(highlights: LinkedInHighlightMap): string {
  const keys = Object.keys(highlights) as LinkedInHighlightSection[];
  if (keys.length === 0) return "LinkedIn profile updated";
  if (keys.length === 1) {
    const section = keys[0]!;
    return `${SECTION_LABELS[section]} updated`;
  }
  return "LinkedIn profile updated";
}

export function computeAdkLinkedInReviewFromDiff(
  baseline: LinkedInSessionProfile,
  next: LinkedInSessionProfile
): { highlights: LinkedInHighlightMap; bannerTitle: string } {
  const highlights: LinkedInHighlightMap = {};

  if ((baseline.headline ?? "") !== (next.headline ?? "")) {
    highlights.headline = "modified";
  }
  if ((baseline.about ?? "") !== (next.about ?? "")) {
    highlights.about = "modified";
  }
  if (stableJson(baseline.experience) !== stableJson(next.experience)) {
    highlights.exp = "modified";
  }
  if (stableJson(baseline.skills) !== stableJson(next.skills)) {
    highlights.skills = "modified";
  }
  if (connectionSig(baseline.connection_draft) !== connectionSig(next.connection_draft)) {
    highlights.connection = "modified";
  }
  if (commentSig(baseline.comment_draft) !== commentSig(next.comment_draft)) {
    highlights.comment = "modified";
  }

  return {
    highlights,
    bannerTitle: deriveLinkedInBannerTitle(highlights),
  };
}
