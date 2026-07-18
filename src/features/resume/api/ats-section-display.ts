import type { AtsSectionKey, AtsSectionUiStatus } from "./ats-types";

const SCORE_SUFFIX_RE = /\s*\(\d+\/\d+\)\s*$/;

/**
 * Fallback copy when backend feedback is empty or too long to display.
 * Critical copy is fit-focused ("retarget/reframe"), not "add a section":
 * genuinely missing sections surface the backend's explicit
 * "… section is missing." feedback directly and never reach these fallbacks.
 */
const STATUS_FALLBACK: Partial<Record<AtsSectionKey, Record<AtsSectionUiStatus, string>>> = {
  header: {
    warning: "Complete missing header contact fields.",
    critical: "Add required header details.",
    good: "Strong professional header.",
  },
  profile: {
    warning: "Strengthen your professional summary.",
    critical: "Retarget your summary to this role.",
    good: "Summary looks solid.",
  },
  experience: {
    warning: "Strengthen experience bullets for this role.",
    critical: "Reframe experience bullets around this role's requirements.",
    good: "Experience section looks strong.",
  },
  skills: {
    warning: "Add role-relevant skills.",
    critical: "Expand skills with tools this role asks for.",
    good: "Skills align well with the role.",
  },
  education: {
    warning: "Add more education detail.",
    critical: "Add detail to your education entries.",
    good: "Education section is in good shape.",
  },
  projects: {
    warning: "Strengthen project descriptions and outcomes.",
    critical: "Strengthen projects with tools and measurable outcomes.",
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

/** G5: Summary feedback must never describe Header/contact fields. */
const PROFILE_CONTACT_VOCAB =
  /\b(contact information|essential contact|email|phone|linkedin|github|portfolio link|phone number|mobile number)\b/i;

const stripScoreFromText = (text: string): string => text.replace(SCORE_SUFFIX_RE, "").trim();

/**
 * Sentence terminator followed by whitespace + an opening capital/quote/paren.
 * Abbreviation periods ("B.E.", "B.Tech", "e.g.") are skipped so feedback like
 * "… aligns with the B.E. requirement." is not cut mid-abbreviation.
 */
const SENTENCE_BOUNDARY_RE = /[.!?](?=\s+["'(A-Z])/g;

const ABBREVIATION_TAIL_RE =
  /(?:^|\s)(?:[A-Za-z]|e\.g|i\.e|etc|vs|approx|no|st|dr|mr|mrs|ms|b\.e|b\.sc|b\.tech|m\.e|m\.sc|m\.tech|b\.a|m\.a|ph\.d)$/i;

const firstSentence = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  SENTENCE_BOUNDARY_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SENTENCE_BOUNDARY_RE.exec(trimmed)) !== null) {
    const beforeTerminator = trimmed.slice(0, match.index);
    if (ABBREVIATION_TAIL_RE.test(beforeTerminator)) continue;
    return trimmed.slice(0, match.index + 1).trim();
  }
  return trimmed;
};

export const buildScoreLabel = (score: number | undefined, maxScore: number | undefined): string | undefined => {
  if (typeof score !== "number" || !Number.isFinite(score)) return undefined;
  if (typeof maxScore === "number" && Number.isFinite(maxScore) && maxScore > 0) {
    return `${Math.round(score)}/${Math.round(maxScore)}`;
  }
  return `${Math.round(score)}/100`;
};

export const sanitizeProfileFeedback = (rawFeedback: string, status: AtsSectionUiStatus): string => {
  const cleaned = stripScoreFromText(rawFeedback);
  if (!cleaned || cleaned === "—" || PROFILE_CONTACT_VOCAB.test(cleaned)) {
    return STATUS_FALLBACK.profile?.[status] ?? "Strengthen your professional summary.";
  }
  return cleaned;
};

export const buildDisplayFeedback = (rawFeedback: string, status: AtsSectionUiStatus, sectionKey: AtsSectionKey): string => {
  const cleaned = sectionKey === "profile" ? sanitizeProfileFeedback(rawFeedback, status) : stripScoreFromText(rawFeedback);
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
