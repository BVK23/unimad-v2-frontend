import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import { isResumeImproveHandoffPrompt } from "@/features/resume/api/resume-improve-prompts";

export const RESUME_IMPROVE_PREFIX = "Please improve the following text for my resume:";

export const LINKEDIN_IMPROVE_PREFIX = "Improve my LinkedIn ";

export const LINKEDIN_IMPROVE_PROFILE_FALLBACK = "Improve my LinkedIn profile.";

/** User message sent as a main chat turn for section-review handoffs (not the legacy topic thread). */
export const UNIBOT_SECTION_REVIEW_PROMPTS: Record<UnibotResumeSection, string> = {
  summary: "Improve my professional summary",
  education: "Improve my education section",
  experience: "Improve my work experience section",
  skills: "Improve my skills section",
  projects: "Improve my projects section",
  certifications: "Improve my certifications section",
  custom: "Improve my custom resume section",
};

const SECTION_REVIEW_PROMPTS = new Set(Object.values(UNIBOT_SECTION_REVIEW_PROMPTS));

/** Legacy verbose section-review prompts — still treated as handoffs for title generation. */
const LEGACY_SECTION_REVIEW_PROMPTS = new Set([
  "Please review my professional summary on my resume and suggest concrete improvements. You can use my current resume context from the session.",
  "Please review my professional summary on my resume. Use get_summary and get_section for resume data; if sections are empty, call fetch_user_personal_details for onboarding profile. Explain what's missing if sparse and offer guidance or a placeholder template — do not report the section as unavailable.",
  "Please look at my education section on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  "Please look at my work experience descriptions on my resume and suggest improvements. Use my resume data from the session.",
  "Please look at my skills section on my resume and suggest improvements. Use my resume data from the session.",
  "Please look at my projects section on my resume and suggest improvements (including project descriptions). Use my resume data from the session.",
  "Please look at my certifications on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  "Please look at my custom section content on my resume and suggest improvements. Use my resume data from the session.",
]);

/**
 * True for improve / section-review / LinkedIn wand handoffs that should not drive auto chat titles.
 * Arbitrary LinkedIn v1 free-text handoffs (user-selected copy) cannot be detected from ADK history alone.
 */
export function isHandoffPromptForTitle(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith(RESUME_IMPROVE_PREFIX)) return true;
  if (isResumeImproveHandoffPrompt(trimmed)) return true;
  if (trimmed.startsWith(LINKEDIN_IMPROVE_PREFIX)) return true;
  if (trimmed === LINKEDIN_IMPROVE_PROFILE_FALLBACK) return true;
  if (SECTION_REVIEW_PROMPTS.has(trimmed)) return true;
  if (LEGACY_SECTION_REVIEW_PROMPTS.has(trimmed)) return true;
  return false;
}
