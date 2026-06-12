/**
 * Payload for opening Unibot from resume editors (window "open-unibot" or lifted React state).
 */
export type UnibotResumeSection = "summary" | "education" | "experience" | "projects" | "certifications" | "custom";

/** LinkedIn ADK section keys (v2 sub-sessions); v1 uses free-text on main session. */
export type UnibotLinkedInSection = "pic" | "cover" | "headline" | "about" | "experience" | "skills" | "connection" | "comment";

export type UnibotIncomingRequest =
  | {
      type: "improve";
      text: string;
      /** `linkedin` = main session (v1) or sub-session when featureId + section set (v2). */
      improveType?: "resume" | "linkedin" | string;
      topicTitle?: string;
      feature?: string;
      featureId?: string;
      section?: UnibotResumeSection | UnibotLinkedInSection;
      entryId?: string;
      /** Bumps when the wand is clicked so repeat improves on the same entry can run. */
      requestKey?: number;
    }
  | { type: "section_review"; section: UnibotResumeSection; requestKey: number }
  | {
      type: "content_gen_topic";
      seedTopic?: string;
      followUpText?: string;
      topicTitle?: string;
      reuseExistingTopic?: boolean;
      requestKey: number;
    };

export interface UnibotImproveTarget {
  section: UnibotResumeSection;
  resumeId: string;
  entryId?: string;
}

/** User message sent as a main chat turn (not the legacy topic thread). */
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

/** Stable dedupe key for one-shot improve / section-review handoffs (must not use Date.now()). */
export function incomingRequestSignature(req: UnibotIncomingRequest): string {
  if (req.type === "section_review") {
    return `section_review:${req.section}:${req.requestKey}`;
  }
  if (req.type === "content_gen_topic") {
    return `content_gen_topic:${req.requestKey}`;
  }
  return [
    "improve",
    req.improveType ?? "",
    req.featureId ?? "",
    req.section ?? "",
    req.entryId ?? "",
    req.topicTitle ?? "",
    req.text,
    req.requestKey != null ? String(req.requestKey) : "",
  ].join("|");
}
