/**
 * Payload for opening Unibot from resume editors (window "open-unibot" or lifted React state).
 */
export type UnibotResumeSection = "summary" | "education" | "experience" | "projects" | "skills" | "certifications" | "custom";

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
      /** Resume wand: whether the target field already has content (agent reads via tools). */
      hasContent?: boolean;
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
      /** Routes to linkedin_post draft sub-session; does not embed draft body in the prompt. */
      improveDraft?: boolean;
      /** Persisted ContentGen post id — scopes the sub-thread (one thread per post). */
      assetId?: string;
      funnel?: import("@/features/content-lab/api/adk-mappers").ContentGenFunnel;
      requestKey: number;
    };

export interface UnibotImproveTarget {
  section: UnibotResumeSection;
  resumeId: string;
  entryId?: string;
}

export { UNIBOT_SECTION_REVIEW_PROMPTS } from "@/features/adk-chat/handoff-prompts";

/** Stable dedupe key for one-shot improve / section-review handoffs (must not use Date.now()). */
export function incomingRequestSignature(req: UnibotIncomingRequest): string {
  if (req.type === "section_review") {
    return `section_review:${req.section}:${req.requestKey}`;
  }
  if (req.type === "content_gen_topic") {
    return `content_gen_topic:${req.assetId ?? ""}:${req.seedTopic ?? ""}:${req.improveDraft ? "improve" : "topic"}:${req.requestKey}`;
  }
  return [
    "improve",
    req.improveType ?? "",
    req.featureId ?? "",
    req.section ?? "",
    req.entryId ?? "",
    req.hasContent != null ? String(req.hasContent) : "",
    req.topicTitle ?? "",
    req.text,
    req.requestKey != null ? String(req.requestKey) : "",
  ].join("|");
}
