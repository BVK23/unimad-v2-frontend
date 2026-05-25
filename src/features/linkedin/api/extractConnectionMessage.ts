/**
 * Extract LinkedIn connection note from Unibot `connect` section responses.
 * Backend returns JSON fences with string `data` (see unibot_utils connect context).
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

export const extractConnectionMessageFromBotResponse = (botMessage: string): string => {
  let best = "";
  JSON_FENCE_GLOBAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = JSON_FENCE_GLOBAL_REGEX.exec(botMessage)) !== null) {
    try {
      const cleanedJSON = cleanJsonPayload(match[1]);
      const parsed = JSON.parse(cleanedJSON) as { data?: unknown };
      if (typeof parsed.data === "string") {
        const candidate = parsed.data.trim();
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
