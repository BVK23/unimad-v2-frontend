/**
 * Strip machine-readable JSON payloads from agent chat copy.
 * Agents emit drafts/planner chips as `{ "data": ... }` (often inside ```json fences).
 * During SSE streaming those payloads arrive token-by-token; complete-only strippers
 * leave a visible flash of raw JSON until the closing quote/brace arrives.
 */

const JSON_FENCE_STRIP_REGEX = /```\s*json\s*[\s\S]*?```/gi;
const UNCLOSED_JSON_FENCE_REGEX = /```\s*json[\s\S]*$/gi;
const INLINE_DRAFT_JSON_REGEX = /\{\s*"data"\s*:\s*"(?:[^"\\]|\\.)*"\s*\}/g;
const INLINE_DATA_OBJECT_REGEX = /\{\s*"data"\s*:\s*\{[\s\S]*?\}\s*\}/g;
const PARTIAL_INLINE_DATA_STRING_REGEX = /\{\s*"data"\s*:\s*"(?:[^"\\]|\\.)*$/g;
const PARTIAL_INLINE_DATA_OBJECT_REGEX = /\{\s*"data"\s*:\s*\{[\s\S]*$/g;
const PARTIAL_DATA_KEY_REGEX = /\{\s*"data"\s*:\s*"?$/g;
const TRAILING_OPEN_BRACE_REGEX = /\{\s*$/g;

export const messageContainsMachineReadablePayload = (botMessage: string): boolean => {
  const trimmed = botMessage.trim();
  if (!trimmed) {
    return false;
  }
  return /```\s*json/i.test(trimmed) || /\{\s*"data"\s*:/.test(trimmed) || TRAILING_OPEN_BRACE_REGEX.test(trimmed);
};

/** Remove complete and in-progress `{ "data": ... }` payloads from visible chat copy. */
export const stripMachineReadablePayloadFromMessage = (botMessage: string): string => {
  return botMessage
    .replace(JSON_FENCE_STRIP_REGEX, "")
    .replace(UNCLOSED_JSON_FENCE_REGEX, "")
    .replace(INLINE_DRAFT_JSON_REGEX, "")
    .replace(INLINE_DATA_OBJECT_REGEX, "")
    .replace(PARTIAL_INLINE_DATA_STRING_REGEX, "")
    .replace(PARTIAL_INLINE_DATA_OBJECT_REGEX, "")
    .replace(PARTIAL_DATA_KEY_REGEX, "")
    .replace(TRAILING_OPEN_BRACE_REGEX, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/** True when the bubble is only streaming machine-readable JSON (no user-facing prose yet). */
export const isStreamingMachineReadablePayloadOnly = (botMessage: string | undefined): boolean => {
  if (!botMessage?.trim()) {
    return false;
  }
  if (!messageContainsMachineReadablePayload(botMessage)) {
    return false;
  }
  return stripMachineReadablePayloadFromMessage(botMessage).length === 0;
};
