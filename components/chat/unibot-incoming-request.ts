/**
 * Payload for opening Unibot from resume editors (window "open-unibot" or lifted React state).
 */
export type UnibotResumeSection =
  | "summary"
  | "education"
  | "experience"
  | "projects"
  | "certifications"
  | "custom";

export type UnibotIncomingRequest =
  | { type: "improve"; text: string }
  | { type: "section_review"; section: UnibotResumeSection; requestKey: number };

/** User message sent as a main chat turn (not the legacy topic thread). */
export const UNIBOT_SECTION_REVIEW_PROMPTS: Record<UnibotResumeSection, string> = {
  summary:
    "Please review my professional summary on my resume and suggest concrete improvements. You can use my current resume context from the session.",
  education:
    "Please look at my education section on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  experience:
    "Please look at my work experience descriptions on my resume and suggest improvements. Use my resume data from the session.",
  projects:
    "Please look at my projects section on my resume and suggest improvements (including project descriptions). Use my resume data from the session.",
  certifications:
    "Please look at my certifications on my resume and suggest improvements (including descriptions if any). Use my resume data from the session.",
  custom:
    "Please look at my custom section content on my resume and suggest improvements. Use my resume data from the session.",
};
