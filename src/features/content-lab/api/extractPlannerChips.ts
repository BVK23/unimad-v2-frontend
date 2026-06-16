/**
 * Parse topics, affirmations, and actions from planner / topic_planner_agent responses.
 */
import { stripMachineReadablePayloadFromMessage } from "@/features/adk-chat/utils/strip-machine-readable-payload";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import type { ContentGenPlannerAction, ContentGenPlannerActionId } from "@/features/content-lab/api/content-gen-events";

const JSON_FENCE_REGEX = /```\s*json\s*([\s\S]*?)```/gi;

const VALID_ACTION_IDS = new Set<ContentGenPlannerActionId>(["generate_draft", "post_now", "schedule"]);

/** Remove machine-readable JSON from assistant copy shown in the UI. */
export const stripPlannerJsonFromMessage = (botMessage: string): string => {
  return stripMachineReadablePayloadFromMessage(botMessage);
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

function normalizeList(items: unknown[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

function normalizeActions(raw: unknown): ContentGenPlannerAction[] {
  if (!Array.isArray(raw)) return [];
  const out: ContentGenPlannerAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = row.id;
    if (typeof id !== "string" || !VALID_ACTION_IDS.has(id as ContentGenPlannerActionId)) continue;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) continue;
    const scheduledAt =
      typeof row.scheduled_at === "string" ? row.scheduled_at : typeof row.scheduledAt === "string" ? row.scheduledAt : undefined;
    out.push({
      id: id as ContentGenPlannerActionId,
      label,
      scheduledAt,
    });
  }
  return out;
}

export type PlannerChips = {
  topics: string[];
  affirmations: string[];
  actions: ContentGenPlannerAction[];
};

export const parsePlannerChips = (botMessage: string): PlannerChips => {
  const merged: PlannerChips = { topics: [], affirmations: [], actions: [] };
  JSON_FENCE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  let foundFence = false;

  while ((match = JSON_FENCE_REGEX.exec(botMessage)) !== null) {
    foundFence = true;
    try {
      const cleanedJSON = cleanJsonPayload(match[1]);
      const parsed = JSON.parse(cleanedJSON) as { data?: unknown };
      const dataValue = parsed.data;

      if (dataValue == null) continue;

      if (Array.isArray(dataValue)) {
        merged.topics = [...merged.topics, ...normalizeList(dataValue)];
        continue;
      }

      if (typeof dataValue !== "object") continue;
      const obj = dataValue as Record<string, unknown>;
      if (Array.isArray(obj.topics)) {
        merged.topics = [...merged.topics, ...normalizeList(obj.topics)];
      }
      if (Array.isArray(obj.affirmations)) {
        merged.affirmations = [...merged.affirmations, ...normalizeList(obj.affirmations)];
      }
      if (Array.isArray(obj.actions)) {
        merged.actions = [...merged.actions, ...normalizeActions(obj.actions)];
      }
    } catch {
      // try next fence
    }
  }

  if (!foundFence) {
    return merged;
  }

  const dedupe = (arr: string[]) => [...new Set(arr)];
  const dedupeActions = (arr: ContentGenPlannerAction[]) => {
    const seen = new Set<string>();
    return arr.filter(a => {
      const key = `${a.id}:${a.label}:${a.scheduledAt ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    topics: dedupe(merged.topics),
    affirmations: dedupe(merged.affirmations),
    actions: dedupeActions(merged.actions),
  };
};

export const messageHasPlannerChips = (botMessage: string): boolean => {
  const { topics, affirmations, actions } = parsePlannerChips(botMessage);
  return topics.length > 0 || affirmations.length > 0 || actions.length > 0;
};

const CONFIRMED_TOPIC_PATTERNS: RegExp[] = [
  /(?:let'?s go with|i'?ll go with|going with|picked|selected|choosing)\s+["'\u201C\u2018]([^"'\u201D\u2019]{8,120})["'\u201D\u2019]/i,
  /(?:let'?s go with|i'?ll go with|going with|picked|selected|choosing)\s+\*\*([^*]{8,120})\*\*/i,
  /(?:topic|angle|idea)\s*(?:is|will be|:)\s*["'\u201C\u2018]([^"'\u201D\u2019]{8,120})["'\u201D\u2019]/i,
  /(?:topic|angle|idea)\s*(?:is|will be|:)\s*\*\*([^*]{8,120})\*\*/i,
];

type ThreadMessageLike = {
  role: string;
  text?: string;
};

/**
 * Walk a thread's messages (newest first) and extract the last confirmed topic.
 * Checks: single-topic JSON chip, NL "let's go with 'X'" patterns, or generate_draft alongside topics.
 */
export const extractConfirmedTopicFromThread = (threadMessages: ThreadMessageLike[]): string | null => {
  for (let i = threadMessages.length - 1; i >= 0; i--) {
    const msg = threadMessages[i];
    if (msg.role !== "model" || !msg.text?.trim()) {
      continue;
    }

    const chips = parsePlannerChips(msg.text);

    if (chips.topics.length === 1 && chips.topics[0].length >= 8) {
      return chips.topics[0];
    }

    if (chips.actions.some(a => a.id === "generate_draft") && chips.topics.length > 0) {
      return chips.topics[0];
    }

    const stripped = stripPlannerJsonFromMessage(msg.text);
    for (const pattern of CONFIRMED_TOPIC_PATTERNS) {
      const match = stripped.match(pattern);
      if (match?.[1]?.trim() && match[1].trim().length >= 8) {
        return match[1].trim();
      }
    }
  }

  return null;
};

/** Infer funnel from user chip selection text. */
export const inferFunnelFromChipLabel = (label: string): ContentGenFunnel | null => {
  const lower = label.toLowerCase().trim();
  if (/^top(\s+of\s+funnel|\s+funnel)?$/i.test(lower) || lower === "top") {
    return "top";
  }
  if (/^middle(\s+of\s+funnel|\s+funnel)?$/i.test(lower) || lower === "middle") {
    return "middle";
  }
  if (/^bottom(\s+of\s+funnel|\s+funnel)?$/i.test(lower) || lower === "bottom") {
    return "bottom";
  }
  if (lower.includes("expertise") || lower.includes("thought leadership") || lower.includes("share expertise")) {
    return "top";
  }
  if (lower.includes("story") || lower.includes("authenticity") || lower.includes("tell my story")) {
    return "middle";
  }
  if (lower.includes("open to role") || lower.includes("signal") || lower.includes("recruiter")) {
    return "bottom";
  }
  return null;
};
