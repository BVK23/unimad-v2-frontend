import type { ApplicationAssetApiType } from "@/features/application-assets/types";

export type ApplyApplicationAssetDetail = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  assetId?: string | null;
};

export type RequestApplicationAssetDraftDetail = {
  assetType: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  assetId?: string;
};

export type ApplicationAssetOpenImproveDetail = {
  assetType: ApplicationAssetApiType;
  assetId: string;
  applicationId?: string;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  content: string;
  /** When set with `autoSend`, sends this prompt in the application-asset Unibot topic. */
  initialPrompt?: string;
  /** Opens or reuses the improve topic and sends `initialPrompt` immediately. */
  autoSend?: boolean;
};

/** Default follow-up when continuing to refine a generated Studio draft in Unibot. */
export const IMPROVE_INITIAL_DRAFT_PROMPT = "Improve this initial draft";

export type ApplicationAssetDraftReadyDetail = {
  assetId: string;
  assetType: ApplicationAssetApiType;
  draft: string;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
};

export type ApplicationAssetDraftPreviewDetail = {
  draft: string;
  assetType: ApplicationAssetApiType;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
  assetId?: string | null;
};

export type ApplicationAssetDraftFailedDetail = {
  message?: string;
};

export type ApplicationAssetReviewAcceptedDetail = {
  assetType: ApplicationAssetApiType;
  assetId?: string | null;
};

export type ApplicationAssetSelectionRefineDetail = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  instruction: string;
  presetLabel: string;
  message: string;
  baselineDraft: string;
};

export type ApplicationAssetSelectionFreeformDetail = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  baselineDraft: string;
};

export const APPLICATION_ASSET_EVENTS = {
  applyContext: "apply-application-asset-context",
  draftReady: "application-asset-draft-ready",
  draftPreview: "application-asset-draft-preview",
  draftStreamComplete: "application-asset-draft-stream-complete",
  draftFailed: "application-asset-draft-failed",
  /** Chat-only: opens a collapsible ADK topic in Unibot (natural-language flow). */
  openDraft: "open-application-asset-draft",
  /** Studio form / Prepare modal: ADK headless generate + persist, or Django preview-only fallback. */
  requestDraft: "request-application-asset-draft",
  /** Studio UX: emitted after review accept has been persisted. */
  reviewAccepted: "application-asset-review-accepted",
  /** Studio selection: preset quick action fires refinement in application_asset topic. */
  selectionRefine: "application-asset-selection-refine",
  /** Studio selection: open chat with quoted selection for freeform instruction. */
  selectionFreeform: "application-asset-selection-freeform",
  /** Prepare → Studio Improve: open Unibot with full-document preset chips (no auto-send). */
  openImprove: "application-asset-open-improve",
} as const;
