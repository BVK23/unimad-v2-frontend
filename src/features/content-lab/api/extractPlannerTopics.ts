/**
 * Parse topic (or affirmation chip) strings from Unibot `planner` responses.
 * Matches backend contract: JSON in ```json fences, often `{ "data": { "topics": [...] } }`.
 */

const JSON_FENCE_REGEX = /```\s*json\s*([[{][\s\S]*?[}\]])\s*```/;

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

export const extractPlannerTopics = (botMessage: string): string[] => {
  const suggestionMatch = botMessage.match(JSON_FENCE_REGEX);
  if (!suggestionMatch) {
    return [];
  }

  try {
    const cleanedJSON = cleanJsonPayload(suggestionMatch[1]);
    const parsed = JSON.parse(cleanedJSON) as { data?: unknown };
    const dataValue = parsed.data;

    if (dataValue == null) {
      return [];
    }

    if (typeof dataValue === "object" && !Array.isArray(dataValue)) {
      const obj = dataValue as Record<string, unknown>;
      if (Array.isArray(obj.topics)) {
        return normalizeList(obj.topics);
      }
      if (Array.isArray(obj.affirmations)) {
        return normalizeList(obj.affirmations);
      }
    }

    if (Array.isArray(dataValue)) {
      return normalizeList(dataValue);
    }
  } catch {
    return [];
  }

  return [];
};
