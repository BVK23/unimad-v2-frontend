import type { AgentMessage, TimelineActivity } from "./types";

function normalizeAiContent(content: string): string {
  return content.trim().replace(/\s+/g, " ");
}

/**
 * True when two AI bubbles in the same user turn look like incremental revisions
 * of one reply (ReAct tool loops), not two intentionally distinct assistant messages.
 */
export function shouldMergeSimilarAiMessages(earlier: string, later: string): boolean {
  const a = normalizeAiContent(earlier);
  const b = normalizeAiContent(later);
  if (!a || !b) return true;
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;

  const prefixLen = Math.min(60, a.length, b.length);
  if (prefixLen >= 20 && a.slice(0, prefixLen) === b.slice(0, prefixLen)) return true;

  return false;
}

function mergeTimelineActivities(
  base: TimelineActivity[] | undefined,
  extra: TimelineActivity[] | undefined
): TimelineActivity[] | undefined {
  const merged = [...(base ?? []), ...(extra ?? [])];
  return merged.length > 0 ? merged : undefined;
}

function collapseAiRun<T extends AgentMessage>(run: T[]): T[] {
  if (run.length <= 1) return run;

  const out: T[] = [];
  let current = run[0];
  let pendingActivities = current.timelineActivities;

  for (let i = 1; i < run.length; i++) {
    const next = run[i];
    if (shouldMergeSimilarAiMessages(current.content, next.content)) {
      pendingActivities = mergeTimelineActivities(pendingActivities, next.timelineActivities);
      current = {
        ...next,
        timelineActivities: pendingActivities,
      };
    } else {
      out.push(current);
      current = next;
      pendingActivities = next.timelineActivities;
    }
  }

  out.push(current);
  return out;
}

/**
 * Merges consecutive AI messages between human turns when their text looks like
 * repeated narration from the same agent invocation. Distinct multi-bubble replies
 * (e.g. coordinator handoff + specialist answer) are preserved.
 */
export function collapseSimilarConsecutiveAiMessages<T extends AgentMessage>(messages: T[]): T[] {
  if (messages.length < 2) return messages;

  const result: T[] = [];
  let aiRun: T[] = [];

  const flushAi = () => {
    if (aiRun.length === 0) return;
    result.push(...collapseAiRun(aiRun));
    aiRun = [];
  };

  for (const message of messages) {
    if (message.type === "human") {
      flushAi();
      result.push(message);
    } else {
      aiRun.push(message);
    }
  }

  flushAi();
  return result;
}
