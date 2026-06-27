export type ContentGenFunnel = "top" | "middle" | "bottom";

export const CONTENT_GEN_FUNNEL_LABELS: Record<ContentGenFunnel, string> = {
  top: "Sharing expertise",
  middle: "Personal story",
  bottom: "Open to roles",
};

export const funnelDisplayLabel = (funnel: ContentGenFunnel): string => CONTENT_GEN_FUNNEL_LABELS[funnel];

export const CONTENT_GEN_FUNNEL_STUDIO_OPTIONS: { value: ContentGenFunnel; label: string }[] = [
  { value: "top", label: "Top of Funnel" },
  { value: "middle", label: "Middle of Funnel" },
  { value: "bottom", label: "Bottom of Funnel" },
];

export function funnelFromStudioContentTypeLabel(label: string): ContentGenFunnel | null {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("top")) return "top";
  if (normalized.includes("middle")) return "middle";
  if (normalized.includes("bottom")) return "bottom";
  return null;
}

export function studioContentTypeLabelForFunnel(funnel: ContentGenFunnel): string {
  return CONTENT_GEN_FUNNEL_STUDIO_OPTIONS.find(o => o.value === funnel)?.label ?? funnel;
}

export type ContentGenMood = "Professional" | "Casual" | "Enthusiastic" | "Thought Leadership" | "Storytelling";

export const CONTENT_GEN_MOODS: ContentGenMood[] = ["Professional", "Casual", "Enthusiastic", "Thought Leadership", "Storytelling"];

export type ContentGenPostDraftRow = {
  topic?: string;
  funnel?: string;
  mood?: string;
  body?: string;
  asset_id?: string;
};

export type ContentGenAdkStateDeltaPayload = {
  active_context: "content_gen";
  content_gen_topic?: string;
  content_gen_funnel?: ContentGenFunnel | null;
  content_gen_mood?: ContentGenMood | string | null;
  content_gen_asset_id?: string | null;
  content_gen_draft_preview?: string;
  content_gen_data?: Record<string, ContentGenPostDraftRow>;
  current_content_gen?: string;
};

export type BuildContentGenStateDeltaInput = {
  topic?: string;
  funnel?: ContentGenFunnel | null;
  mood?: ContentGenMood | string | null;
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
  const mood = input.mood?.trim();
  if (mood) {
    delta.content_gen_mood = mood;
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
        mood: mood ?? "",
        body: draft.slice(0, 8000),
        asset_id: input.assetId ?? "",
      },
    };
  }
  return delta;
}
