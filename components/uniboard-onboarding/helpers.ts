import type { PersonalizationProfile } from "@/features/onboarding/types";

export function buildPersonalizationPayload(answers: {
  goals: string[];
  focus: string[];
  personalize: boolean | null;
  strengths: string[];
  problems: string[];
  praise: string[];
  resumeUploaded: boolean;
}): PersonalizationProfile {
  const tier = answers.strengths.length > 0 ? 3 : answers.personalize ? 2 : answers.goals.length > 0 ? 1 : 0;

  return {
    goals: answers.goals,
    focus: answers.focus,
    personalize_opt_in: answers.personalize,
    strengths: answers.strengths,
    problems: answers.problems,
    praise: answers.praise,
    resume_uploaded: answers.resumeUploaded,
    tier,
    updated_at: new Date().toISOString(),
  };
}

/** Ensure WhatsApp number passes backend checkpoint (+ prefix). */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/\s+/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("44")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

const EXPLORER_GOAL_IDS = new Set(["just_exploring", "just_stalking"]);

/** True when every selected goal is "just exploring" or "just having a look". */
export function isExplorerOnlyGoals(goals: string[]): boolean {
  if (goals.length === 0) return false;
  return goals.every(g => EXPLORER_GOAL_IDS.has(g));
}

/** True when at least one selected goal is an explorer goal (may be mixed with real goals). */
export function hasExplorerGoal(goals: string[]): boolean {
  return goals.some(g => EXPLORER_GOAL_IDS.has(g));
}

/** @deprecated Use isExplorerOnlyGoals — kept for callers that only need any explorer goal. */
export function isExplorerGoals(goals: string[]): boolean {
  return isExplorerOnlyGoals(goals);
}

/** Move parenthetical qualifiers from role title into the description. */
export function formatRoleSuggestion(title: string, rationale?: string): { title: string; rationale: string } {
  const trimmed = title.trim();
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const baseRationale = rationale?.trim() || "Suggested from your profile and career intent.";

  if (!match) {
    return { title: trimmed, rationale: baseRationale };
  }

  const cleanTitle = match[1].trim();
  const qualifier = match[2].trim();
  const qualifierNote = qualifier.charAt(0).toUpperCase() + qualifier.slice(1);

  return {
    title: cleanTitle,
    rationale: baseRationale.includes(qualifier)
      ? baseRationale
      : `${qualifierNote}. ${baseRationale.charAt(0).toLowerCase()}${baseRationale.slice(1)}`,
  };
}

/** Keep niche role blurbs to one short line (~2 lines in UI). */
export function curtailRationale(text: string, maxWords = 16): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Strong match for your profile and market demand.";

  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const words = firstSentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return firstSentence;

  return `${words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,;:\-–—]+$/, "")}…`;
}

const PERSONAL_LINKEDIN_URL_RE = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/i;

function normalizeLinkedInCandidate(raw: string): string {
  let normalized = raw.trim().replace(/\s+/g, "").replace(/\/+$/, "");
  if (normalized.startsWith("@")) normalized = normalized.slice(1);
  if (/^[A-Za-z0-9\-_%]+$/.test(normalized) && !normalized.toLowerCase().includes("linkedin")) {
    return `https://www.linkedin.com/in/${normalized}`;
  }
  if (!/^https?:\/\//i.test(normalized)) {
    return `https://${normalized.replace(/^\/+/, "")}`;
  }
  return normalized;
}

/** Client-side LinkedIn URL validation aligned with backend /in/ rules. */
export function validateLinkedInUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "Please enter your LinkedIn URL or tap Skip for now";
  }

  const normalized = normalizeLinkedInCandidate(trimmed);

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    if (!host.includes("linkedin.com")) {
      return "Please enter a valid LinkedIn profile URL (linkedin.com/in/…)";
    }

    const path = url.pathname.toLowerCase();
    if (path.startsWith("/company/") || path.startsWith("/jobs/") || path.startsWith("/school/")) {
      return "Use your personal profile link: linkedin.com/in/your-name";
    }
    if (!path.startsWith("/in/")) {
      return "Use your personal profile link: linkedin.com/in/your-name";
    }

    const canonical = `https://www.linkedin.com${url.pathname.replace(/\/+$/, "")}`;
    if (!PERSONAL_LINKEDIN_URL_RE.test(canonical) && !PERSONAL_LINKEDIN_URL_RE.test(`${canonical}/`)) {
      return "Personal LinkedIn URL must look like linkedin.com/in/your-handle";
    }

    return null;
  } catch {
    return "Please enter a valid URL";
  }
}

/** Phone validation messages for inline field errors. */
export function getPhoneValidationError(phone: string | undefined, isValid: (value: string) => boolean): string | null {
  if (!phone?.trim()) {
    return "Please enter your WhatsApp number";
  }
  if (!isValid(phone)) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      return "Please enter a complete phone number";
    }
    return "Please enter a valid WhatsApp number for your country";
  }
  return null;
}
