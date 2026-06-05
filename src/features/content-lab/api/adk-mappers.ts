export type ContentGenFunnel = "top" | "middle" | "bottom";

export const CONTENT_GEN_FUNNEL_LABELS: Record<ContentGenFunnel, string> = {
  top: "Sharing expertise",
  middle: "Personal story",
  bottom: "Open to roles",
};

export const funnelDisplayLabel = (funnel: ContentGenFunnel): string => CONTENT_GEN_FUNNEL_LABELS[funnel];

export type ContentGenPostDraftRow = {
  topic?: string;
  funnel?: string;
  body?: string;
  asset_id?: string;
};

export type ContentGenAdkStateDeltaPayload = {
  active_context: "content_gen";
  content_gen_topic?: string;
  content_gen_funnel?: ContentGenFunnel | null;
  content_gen_asset_id?: string | null;
  content_gen_draft_preview?: string;
  content_gen_data?: Record<string, ContentGenPostDraftRow>;
  current_content_gen?: string;
};

export type BuildContentGenStateDeltaInput = {
  topic?: string;
  funnel?: ContentGenFunnel | null;
  assetId?: string | null;
  draftPreview?: string;
};

export function buildAdkContentGenStateDelta(input: BuildContentGenStateDeltaInput = {}): ContentGenAdkStateDeltaPayload {
  const delta: ContentGenAdkStateDeltaPayload = { active_context: "content_gen" };
  const topic = input.topic?.trim();
  if (topic) {
    delta.content_gen_topic = topic;
  }
  if (input.funnel) {
    delta.content_gen_funnel = input.funnel;
  }
  if (input.assetId) {
    delta.content_gen_asset_id = input.assetId;
  }
  const draft = input.draftPreview?.trim();
  if (draft) {
    delta.content_gen_draft_preview = draft.slice(0, 8000);
    delta.current_content_gen = "active";
    delta.content_gen_data = {
      active: {
        topic: topic ?? "",
        funnel: input.funnel ?? "",
        body: draft.slice(0, 8000),
        asset_id: input.assetId ?? "",
      },
    };
  }
  return delta;
}
