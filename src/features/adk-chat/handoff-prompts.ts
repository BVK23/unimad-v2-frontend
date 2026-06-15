import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";

export const RESUME_IMPROVE_PREFIX = "Please improve the following text for my resume:";

export const LINKEDIN_IMPROVE_PREFIX = "Improve my LinkedIn ";

export const LINKEDIN_IMPROVE_PROFILE_FALLBACK = "Improve my LinkedIn profile. Use session tools for context.";

/** User message sent as a main chat turn for section-review handoffs (not the legacy topic thread). */
export const UNIBOT_SECTION_REVIEW_PROMPTS: Record<UnibotResumeSection, string> = {
  summary:
    "Please review my professional summary on my resume and suggest concrete improvements. You can use my current resume context from the session.",
  education:
    "Please look at my education section on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  experience: "Please look at my work experience descriptions on my resume and suggest improvements. Use my resume data from the session.",
  projects:
    "Please look at my projects section on my resume and suggest improvements (including project descriptions). Use my resume data from the session.",
  certifications:
    "Please look at my certifications on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  custom: "Please look at my custom section content on my resume and suggest improvements. Use my resume data from the session.",
};

const SECTION_REVIEW_PROMPTS = new Set(Object.values(UNIBOT_SECTION_REVIEW_PROMPTS));

/**
 * True for improve / section-review / LinkedIn wand handoffs that should not drive auto chat titles.
 * Arbitrary LinkedIn v1 free-text handoffs (user-selected copy) cannot be detected from ADK history alone.
 */
export function isHandoffPromptForTitle(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith(RESUME_IMPROVE_PREFIX)) return true;
  if (trimmed.startsWith(LINKEDIN_IMPROVE_PREFIX)) return true;
  if (trimmed === LINKEDIN_IMPROVE_PROFILE_FALLBACK) return true;
  if (SECTION_REVIEW_PROMPTS.has(trimmed)) return true;
  return false;
}
