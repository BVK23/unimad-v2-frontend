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
 * Returns events that remain visible after the latest rewind marker.
 * Rewound invocations (and everything after them) are excluded from the transcript.
 */
export function filterActiveAdkEvents(events: AdkEvent[]): AdkEvent[] {
  if (events.length === 0) return [];

  const rawEvents = events as RawAdkEvent[];

  let latestRewindBeforeId: string | null = null;
  for (let i = rawEvents.length - 1; i >= 0; i--) {
    const rewindId = getRewindBeforeInvocationId(rawEvents[i]);
    if (rewindId) {
      latestRewindBeforeId = rewindId;
      break;
    }
  }

  const withoutMarkers = rawEvents.filter(event => !isRewindMarkerEvent(event));

  if (!latestRewindBeforeId) {
    return withoutMarkers;
  }

  const cutoffIndex = withoutMarkers.findIndex(event => getEventInvocationId(event) === latestRewindBeforeId);
  if (cutoffIndex === -1) {
    return withoutMarkers;
  }

  return withoutMarkers.slice(0, cutoffIndex);
}
