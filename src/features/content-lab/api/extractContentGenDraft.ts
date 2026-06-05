import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";

/**
 * Extract LinkedIn post body from a contentgen Unibot message (JSON fences with string `data`).
 * Mirrors v1 `extractSuggestions` string branch for `contentgen{n}` sections.
 *
 * Models sometimes emit more than one ```json block (e.g. a short title line then the full post).
 * We take the longest string `data` so the preview is the post, not a topic-sized snippet.
 */

export type ContentGenDraftPayload = {
  draft: string;
  topic?: string;
  funnel?: ContentGenFunnel | null;
};

const JSON_FENCE_GLOBAL_REGEX = /```\s*json\s*([\s\S]*?)```/gi;
const INLINE_DRAFT_JSON_REGEX = /\{\s*"data"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;

const CONTENT_GEN_FUNNELS = new Set<ContentGenFunnel>(["top", "middle", "bottom"]);

const parseFunnelField = (value: unknown): ContentGenFunnel | null => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (CONTENT_GEN_FUNNELS.has(normalized as ContentGenFunnel)) {
    return normalized as ContentGenFunnel;
  }
  return null;
};

const mergePayload = (current: ContentGenDraftPayload, candidate: ContentGenDraftPayload): ContentGenDraftPayload => {
  const draft = candidate.draft.length > current.draft.length ? candidate.draft : current.draft;
  const topic = candidate.topic?.trim() || current.topic;
  const funnel = candidate.funnel ?? current.funnel ?? null;
  return { draft, topic, funnel };
};

const payloadFromParsedObject = (parsed: Record<string, unknown>): ContentGenDraftPayload | null => {
  const dataValue = parsed.data;
  let draft = "";
  if (typeof dataValue === "string") {
    draft = formatDraftString(dataValue);
  }

  const topic = typeof parsed.topic === "string" ? parsed.topic.trim() : undefined;
  const funnel = parseFunnelField(parsed.funnel);

  if (!draft) {
    return null;
  }

  return { draft, topic, funnel };
};

function cleanJsonPayload(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\\(\r\n|\n|\r)/g, "\\n")
    .replace(/\\\\/g, "\\n")
    .replace(/\\(?![ntr\\"])/g, "\\n")
    .replace(/\\ /g, "\\n")
    .replace(/\\(?!["\\/bfnrtu])/g, "")
    .trim();
}

function formatDraftString(s: string): string {
  return s
    .replace(/^\s*\*\s+/gm, "* ")
    .replace(/([^\n])\n(?!\n)/g, "$1  \n")
    .trim();
}

export const extractContentGenDraftPayload = (botMessage: string): ContentGenDraftPayload => {
  let best: ContentGenDraftPayload = { draft: "" };

  INLINE_DRAFT_JSON_REGEX.lastIndex = 0;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = INLINE_DRAFT_JSON_REGEX.exec(botMessage)) !== null) {
    try {
      const unescaped = inlineMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      const candidate = { draft: formatDraftString(unescaped) };
      best = mergePayload(best, candidate);
    } catch {
      // try next
    }
  }

  JSON_FENCE_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_GLOBAL_REGEX.exec(botMessage)) !== null) {
    try {
      const cleanedJSON = cleanJsonPayload(match[1]);
      const parsed = JSON.parse(cleanedJSON) as Record<string, unknown>;
      const candidate = payloadFromParsedObject(parsed);
      if (candidate) {
        best = mergePayload(best, candidate);
      }
    } catch {
      const dataMatch = match[1].match(/"data"\s*:\s*"([\s\S]*)"\s*}/);
      if (dataMatch?.[1]) {
        const unescaped = dataMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        const candidate = { draft: formatDraftString(unescaped) };
        best = mergePayload(best, candidate);
      }

      const topicMatch = match[1].match(/"topic"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (topicMatch?.[1]) {
        best = mergePayload(best, {
          draft: best.draft,
          topic: topicMatch[1].replace(/\\"/g, '"').trim(),
        });
      }
    }
  }

  return best;
};

export const extractContentGenDraftFromBotMessage = (botMessage: string): string => {
  return extractContentGenDraftPayload(botMessage).draft;
};
