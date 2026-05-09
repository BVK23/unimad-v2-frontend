/**
 * Extract LinkedIn post body from a contentgen Unibot message (JSON fences with string `data`).
 * Mirrors v1 `extractSuggestions` string branch for `contentgen{n}` sections.
 *
 * Models sometimes emit more than one ```json block (e.g. a short title line then the full post).
 * We take the longest string `data` so the preview is the post, not a topic-sized snippet.
 */

const JSON_FENCE_GLOBAL_REGEX = /```\s*json\s*([\s\S]*?)```/gi;

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

export const extractContentGenDraftFromBotMessage = (botMessage: string): string => {
  let best = "";
  JSON_FENCE_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_GLOBAL_REGEX.exec(botMessage)) !== null) {
    try {
      const cleanedJSON = cleanJsonPayload(match[1]);
      const parsed = JSON.parse(cleanedJSON) as { data?: unknown };
      const dataValue = parsed.data;
      if (typeof dataValue === "string") {
        const candidate = formatDraftString(dataValue);
        if (candidate.length > best.length) {
          best = candidate;
        }
      }
    } catch {
      // try next fence
    }
  }
  return best;
};
