import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";

export type ContentGenSessionDraft = {
  draft: string;
  topic?: string;
  funnel?: ContentGenFunnel | null;
  mood?: string;
};

const parseFunnel = (value: unknown): ContentGenFunnel | null => {
  if (value === "top" || value === "middle" || value === "bottom") {
    return value;
  }
  return null;
};

/** Read LinkedIn post draft body from ADK session state (after update_post_draft). */
export function extractContentGenDraftFromAdkState(state: Record<string, unknown> | null | undefined): ContentGenSessionDraft | null {
  if (!state) {
    return null;
  }

  const topic = typeof state.content_gen_topic === "string" ? state.content_gen_topic.trim() : "";
  const funnel = parseFunnel(state.content_gen_funnel);
  const mood = typeof state.content_gen_mood === "string" ? state.content_gen_mood.trim() : undefined;

  let body = "";
  const data = state.content_gen_data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rows = data as Record<string, unknown>;
    const activeKey = typeof state.current_content_gen === "string" ? state.current_content_gen : "active";
    const row = (rows[activeKey] ?? Object.values(rows)[0]) as Record<string, unknown> | undefined;
    if (row && typeof row.body === "string") {
      body = row.body.trim();
    }
    if (!topic && row && typeof row.topic === "string") {
      // topic may live on the active row only
    }
  }
  if (!body) {
    const legacyPreview = typeof state.content_gen_draft_preview === "string" ? state.content_gen_draft_preview.trim() : "";
    body = legacyPreview;
  }

  if (body.length < CONTENT_GEN_MIN_DRAFT_CHARS) {
    return null;
  }

  return {
    draft: body,
    topic:
      topic ||
      (() => {
        if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
        const rows = data as Record<string, { topic?: string }>;
        const activeKey = typeof state.current_content_gen === "string" ? state.current_content_gen : "active";
        return rows[activeKey]?.topic ?? Object.values(rows)[0]?.topic;
      })(),
    funnel,
    mood,
  };
}
