import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";

export type ContentGenPlannerActionId = "generate_draft" | "post_now" | "schedule";

export type ContentGenPlannerAction = {
  id: ContentGenPlannerActionId;
  label: string;
  scheduledAt?: string;
};

export type ApplyContentGenTopicDetail = {
  topic: string;
  funnel?: ContentGenFunnel;
  assetId?: string | null;
  /** Brief highlight pulse on Studio topic input after chip click. */
  flashInput?: boolean;
};

export type RequestContentGenDraftDetail = {
  topic: string;
  funnel?: ContentGenFunnel | null;
  mood?: string | null;
};

export type ContentGenDraftReadyDetail = {
  assetId: string;
  draft: string;
};

export type RequestContentGenPublishDetail = {
  mode: "post_now" | "schedule";
  scheduledAt?: string;
  /** When true, chat runs publish/schedule without opening PostSchedulerModal. */
  background?: boolean;
};

export type ContentGenPublishCompleteDetail = {
  mode: "post_now" | "schedule";
  assetId: string;
  scheduledAt?: string;
};

export type ContentGenDraftFailedDetail = {
  message?: string;
};

export type ContentGenDraftPreviewDetail = {
  draft: string;
  topic?: string;
  funnel?: ContentGenFunnel | null;
  assetId?: string | null;
  isTopicChange?: boolean;
};

export type ContentGenPublishBlockedDetail = {
  message?: string;
};

export type ContentGenPublishFailedDetail = {
  message?: string;
};

export type OpenContentGenDraftDetail = {
  topic: string;
  funnel?: ContentGenFunnel;
  mood?: string;
  assetId?: string | null;
};

export const CONTENT_GEN_EVENTS = {
  applyTopic: "apply-content-gen-topic",
  requestDraft: "request-content-gen-draft",
  draftReady: "content-gen-draft-ready",
  draftPreview: "content-gen-draft-preview",
  /** ADK draft stream finished (review pending Accept); clears Studio loading state. */
  draftStreamComplete: "content-gen-draft-stream-complete",
  draftFailed: "content-gen-draft-failed",
  /** Opens PostSchedulerModal; schedule path persists via Django updateContentGenAsset (scheduler reliability is a follow-up). */
  requestPublish: "request-content-gen-publish",
  publishBlocked: "content-gen-publish-blocked",
  publishFailed: "content-gen-publish-failed",
  publishComplete: "content-gen-publish-complete",
  openTopic: "open-content-gen-topic",
  openDraft: "open-content-gen-draft",
} as const;

export const CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE = "Accept the draft review in chat before posting or scheduling to LinkedIn.";
