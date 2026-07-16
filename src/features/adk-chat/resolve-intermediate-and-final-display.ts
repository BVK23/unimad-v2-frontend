/**
 * Presentation policy for intermediate vs final assistant text in Unibot chat.
 *
 * Intermediate narration is about ReAct *parking*, not agent identity:
 * - Parked text (`intermediateNarration`) is always intermediate.
 * - Live unparked text is normally shown as intermediate while streaming
 *   (so huge pre-mutation drafts aren't mistaken for the final answer).
 * - Read-only analyst agents (currently `ats_agent`) stream as final user-facing
 *   answers because their primary product output is analysis, not a draft before a mutate.
 *
 * Author alone does not make text intermediate. Mutating tools park text;
 * analysts can produce final text.
 */

/** Agents whose streamed text is user-facing analysis (not ReAct pre-mutation draft). */
export const USER_FACING_ANALYSIS_AGENTS = new Set(["ats_agent"]);

export function streamsUserFacingAnalysis(agent?: string): boolean {
  const key = (agent ?? "").trim().toLowerCase();
  return USER_FACING_ANALYSIS_AGENTS.has(key);
}

export type IntermediateFinalDisplay = {
  intermediateText: string;
  finalText: string;
  intermediateIsStreaming: boolean;
};

/**
 * Split parked ReAct interim text from the final reply.
 *
 * Rules:
 * 1. If `intermediateNarration` is parked → that is intermediate; `modelVisibleText` is final.
 * 2. Else if live-streaming and author is a read-only analyst → stream as final (not intermediate).
 * 3. Else if live-streaming → treat live text as intermediate until stream ends / mutate parks it.
 * 4. Else → live/settled text is final.
 */
export function resolveIntermediateAndFinalDisplay(input: {
  modelVisibleText: string;
  intermediateNarration?: string;
  isLiveStreaming: boolean;
  agent?: string;
}): IntermediateFinalDisplay {
  const parked = input.intermediateNarration?.trim() ?? "";
  const content = input.modelVisibleText.trim();

  if (parked) {
    return {
      intermediateText: parked,
      finalText: content,
      intermediateIsStreaming: input.isLiveStreaming && !content,
    };
  }

  if (input.isLiveStreaming && content && !streamsUserFacingAnalysis(input.agent)) {
    return {
      intermediateText: content,
      finalText: "",
      intermediateIsStreaming: true,
    };
  }

  return {
    intermediateText: "",
    finalText: content,
    intermediateIsStreaming: false,
  };
}
