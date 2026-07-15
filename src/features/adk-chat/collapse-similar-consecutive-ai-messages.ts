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

/** Meta wrap-up after a real answer (keep the earlier, longer analysis). */
const META_COMPLETION_RE = /^(i('ve| have) (completed|provided|finished)|as there are no|there('s| is) nothing further|summary\s*:)/i;

/** Specialist already acted after proposing / asking (keep the later result). */
const ACTION_DONE_RE =
  /\b(i('ve| have) (updated|replaced|removed|added|changed)|successfully (updated|removed|replaced|added)|your skills are now|all projects have been)\b/i;

function looksLikeClarifyingAsk(text: string): boolean {
  const t = text.trim();
  if (/\?\s*$/.test(t)) return true;
  return /\b(does this sound|would you like|which (one|section|entry)|please (tell|confirm|provide)|or would you prefer)\b/i.test(t);
}

function mergeTimelineActivities(
  base: TimelineActivity[] | undefined,
  extra: TimelineActivity[] | undefined
): TimelineActivity[] | undefined {
  const merged = [...(base ?? []), ...(extra ?? [])];
  return merged.length > 0 ? merged : undefined;
}

function sameAgent(a: AgentMessage, b: AgentMessage): boolean {
  const aa = (a.agent ?? "").trim().toLowerCase();
  const bb = (b.agent ?? "").trim().toLowerCase();
  return Boolean(aa && bb && aa === bb);
}

/**
 * Within one user turn, same-author specialist text before/after tools often becomes
 * two ADK events. Live stream overwrites one bubble; history must pick one.
 * Returns the bubble to keep, or null to keep both distinct.
 */
export function preferCollapsedAiMessage<T extends AgentMessage>(earlier: T, later: T): T | null {
  const a = earlier.content.trim();
  const b = later.content.trim();
  if (!a || !b) {
    return {
      ...later,
      timelineActivities: mergeTimelineActivities(earlier.timelineActivities, later.timelineActivities),
    };
  }

  if (shouldMergeSimilarAiMessages(a, b)) {
    return {
      ...later,
      timelineActivities: mergeTimelineActivities(earlier.timelineActivities, later.timelineActivities),
    };
  }

  if (!sameAgent(earlier, later)) {
    return null;
  }

  const activities = mergeTimelineActivities(earlier.timelineActivities, later.timelineActivities);

  // Proposal / clarifier then tool result → keep the result (live UX).
  if (looksLikeClarifyingAsk(a) && (ACTION_DONE_RE.test(b) || !looksLikeClarifyingAsk(b))) {
    return { ...later, timelineActivities: activities };
  }

  // Long analysis then short "I've completed…" status → keep the analysis.
  if (META_COMPLETION_RE.test(b) && a.length > b.length * 1.25) {
    return { ...earlier, timelineActivities: activities };
  }

  // Same specialist, same turn (tool loop / rephrase) → keep latest.
  return { ...later, timelineActivities: activities };
}

function collapseAiRun<T extends AgentMessage>(run: T[]): T[] {
  if (run.length <= 1) return run;

  const out: T[] = [];
  let current = run[0];

  for (let i = 1; i < run.length; i++) {
    const next = run[i];
    const preferred = preferCollapsedAiMessage(current, next);
    if (preferred) {
      current = preferred;
    } else {
      out.push(current);
      current = next;
    }
  }

  out.push(current);
  return out;
}

/**
 * Merges consecutive AI messages between human turns when their text looks like
 * repeated narration from the same agent invocation. Distinct multi-bubble replies
 * from different authors (e.g. coordinator handoff + specialist answer) are preserved.
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
