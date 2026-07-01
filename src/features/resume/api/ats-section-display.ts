import type { AtsSectionKey, AtsSectionUiStatus } from "./ats-types";

const SCORE_SUFFIX_RE = /\s*\(\d+\/\d+\)\s*$/;

const STATUS_FALLBACK: Partial<Record<AtsSectionKey, Record<AtsSectionUiStatus, string>>> = {
  header: {
    warning: "Complete missing header contact fields.",
    critical: "Add required header details.",
    good: "Strong professional header.",
  },
  profile: {
    warning: "Strengthen your professional summary.",
    critical: "Add a targeted professional summary.",
    good: "Summary looks solid.",
  },
  experience: {
    warning: "Strengthen experience bullets for this role.",
    critical: "Add or improve experience entries.",
    good: "Experience section looks strong.",
  },
  skills: {
    warning: "Add role-relevant skills.",
    critical: "Expand your skills section.",
    good: "Skills align well with the role.",
  },
  education: {
    warning: "Add more education detail.",
    critical: "Include education information.",
    good: "Education section is in good shape.",
  },
  projects: {
    warning: "Strengthen project descriptions and outcomes.",
    critical: "Add relevant projects.",
    good: "Projects section looks strong.",
  },
  certifications: {
    warning: "Add or clarify certifications.",
    critical: "Include relevant certifications.",
    good: "Certifications look good.",
  },
  formatting: {
    warning: "Tighten resume formatting and structure.",
    critical: "Fix formatting issues.",
    good: "Formatting looks clean.",
  },
};

const stripScoreFromText = (text: string): string => text.replace(SCORE_SUFFIX_RE, "").trim();

const firstSentence = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  const sentence = (match?.[0] ?? trimmed).trim();
  if (sentence.length <= 120) return sentence;
  return sentence;
};

export const buildScoreLabel = (score: number | undefined, maxScore: number | undefined): string | undefined => {
  if (typeof score !== "number" || !Number.isFinite(score)) return undefined;
  if (typeof maxScore === "number" && Number.isFinite(maxScore) && maxScore > 0) {
    return `${Math.round(score)}/${Math.round(maxScore)}`;
  }
  return `${Math.round(score)}/100`;
};

export const buildDisplayFeedback = (rawFeedback: string, status: AtsSectionUiStatus, sectionKey: AtsSectionKey): string => {
  const cleaned = stripScoreFromText(rawFeedback);
  if (cleaned && cleaned !== "—") {
    const sentence = firstSentence(cleaned);
    if (sentence.length <= 120) return sentence;
  }
  return STATUS_FALLBACK[sectionKey]?.[status] ?? "Review this section for improvements.";
};

export const buildFullFeedback = (baseFeedback: string, scoreSuffix: string, deltaSuffix: string): string => {
  const base = baseFeedback.trim() || "—";
  return `${base}${scoreSuffix}${deltaSuffix}`;
};
