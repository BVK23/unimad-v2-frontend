import type { AdkEvent } from "./types";

type RawAdkEvent = AdkEvent & {
  invocation_id?: string;
  actions?: AdkEvent["actions"] & {
    rewind_before_invocation_id?: string;
    rewindBeforeInvocationId?: string;
  };
};

/** Normalize API field naming (camelCase vs snake_case). */
export function getEventInvocationId(event: RawAdkEvent): string {
  const raw = event.invocationId ?? event.invocation_id;
  return typeof raw === "string" ? raw.trim() : "";
}

export function getRewindBeforeInvocationId(event: RawAdkEvent): string | null {
  const actions = event.actions;
  if (!actions || typeof actions !== "object") return null;
  const record = actions as Record<string, unknown>;
  const raw = record.rewindBeforeInvocationId ?? record.rewind_before_invocation_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function isRewindMarkerEvent(event: RawAdkEvent): boolean {
  return getRewindBeforeInvocationId(event) !== null;
}

/**
 * Truncate `active` so the invocation `rewindBeforeId` and everything after it are removed.
 * Matches ADK semantics: rewind undoes that turn and all later turns on the current branch.
 */
function truncateBeforeInvocation(active: RawAdkEvent[], rewindBeforeId: string): RawAdkEvent[] {
  const cutoffIndex = active.findIndex(event => getEventInvocationId(event) === rewindBeforeId);
  if (cutoffIndex === -1) return active;
  return active.slice(0, cutoffIndex);
}

/**
 * Returns events that remain visible after applying every rewind marker in order.
 *
 * ADK rewind does not physically delete later events from the session DB. It appends a
 * rewind marker (`rewindBeforeInvocationId`) and continues as a new branch. Visible
 * transcript is computed by walking events chronologically and applying each marker
 * to the accumulating active branch.
 *
 * Important: applying only the *latest* marker is wrong after repeated edit/resend on
 * the same turn — earlier discarded branches still sit before the latest cutoff and
 * would leak back into the UI (especially after refresh).
 *
 * Does NOT mutate Postgres — display filter only.
 */
export function filterActiveAdkEvents(events: AdkEvent[]): AdkEvent[] {
  if (events.length === 0) return [];

  const rawEvents = events as RawAdkEvent[];
  const active: RawAdkEvent[] = [];

  for (const event of rawEvents) {
    const rewindBeforeId = getRewindBeforeInvocationId(event);
    if (rewindBeforeId) {
      const truncated = truncateBeforeInvocation(active, rewindBeforeId);
      active.length = 0;
      active.push(...truncated);
      continue;
    }
    active.push(event);
  }

  return active;
}
