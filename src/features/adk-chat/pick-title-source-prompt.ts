import { isHandoffPromptForTitle } from "./handoff-prompts";
import type { AgentMessage } from "./types";

export { isHandoffPromptForTitle } from "./handoff-prompts";

/** First eligible main-session user message to use as a title source (chronological). */
export function pickTitleSourcePromptFromHistory(messages: AgentMessage[]): string | null {
  for (const message of messages) {
    if (message.type !== "human") continue;
    const content = message.content.trim();
    if (!content || isHandoffPromptForTitle(content)) continue;
    return content;
  }
  return null;
}
