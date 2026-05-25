import type { LinkedInAnalyzeResult, LinkedInSectionAnalysis, LinkedInSectionStatus } from "@/features/linkedin/types";

const SECTION_NAME_MAP: Record<string, string> = {
  pic: "Profile Picture",
  cover: "Cover Picture",
  headline: "Headline",
  about: "About Section",
  exp: "Experience",
  skills: "Skills",
};

const SECTION_ORDER = ["pic", "cover", "headline", "about", "exp", "skills"] as const;

function clampScore(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function mapStatus(value: unknown, score: number): LinkedInSectionStatus {
  if (value === "good" || value === "warning" || value === "critical") return value;
  if (score > 80) return "good";
  if (score > 50) return "warning";
  return "critical";
}

function mapSection(raw: unknown): LinkedInSectionAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const id = String(input.id ?? "")
    .trim()
    .toLowerCase();
  if (!id) return null;

  const normalizedId = id === "experience" ? "exp" : id;
  if (!SECTION_NAME_MAP[normalizedId]) return null;

  const score = clampScore(input.score);
  const feedback = String(input.feedback ?? "").trim();
  const tip = String(input.tip ?? "").trim();
  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    id: normalizedId,
    name: String(input.name ?? SECTION_NAME_MAP[normalizedId]),
    score,
    status: mapStatus(input.status, score),
    feedback: feedback || "Add clearer outcomes and more role-relevant detail.",
    tip: tip || recommendations[0] || "Refresh this section with specific achievements and keywords.",
    priority: typeof input.priority === "string" ? input.priority : undefined,
    recommendations,
  };
}

function sortSections(sections: LinkedInSectionAnalysis[]): LinkedInSectionAnalysis[] {
  const rank = new Map<string, number>(SECTION_ORDER.map((id, index) => [id, index]));
  return [...sections].sort((left, right) => (rank.get(left.id) ?? 99) - (rank.get(right.id) ?? 99));
}

export function mapLinkedInAnalyzeResponse(raw: unknown): LinkedInAnalyzeResult {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sections = Array.isArray(input.sections)
    ? input.sections.map(mapSection).filter((item): item is LinkedInSectionAnalysis => Boolean(item))
    : [];
  const normalizedSections = sortSections(sections);
  const fallbackOverall =
    normalizedSections.length > 0
      ? Math.round(normalizedSections.reduce((total, section) => total + section.score, 0) / normalizedSections.length)
      : 0;

  const coverPictureUrl =
    typeof input.coverPictureUrl === "string" && input.coverPictureUrl.trim().length > 0 ? input.coverPictureUrl.trim() : null;

  return {
    profilePictureUrl:
      typeof input.profilePictureUrl === "string" && input.profilePictureUrl.trim().length > 0 ? input.profilePictureUrl : null,
    coverPictureUrl,
    displayName: typeof input.displayName === "string" ? input.displayName : "",
    overallScore: clampScore(input.overallScore ?? fallbackOverall),
    sections: normalizedSections,
    topActions: Array.isArray(input.topActions)
      ? input.topActions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
  };
}
