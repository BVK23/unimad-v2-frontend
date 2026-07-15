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
 *
 * ADK rewind appends a marker and then continues the session as a new branch.
 * Visible transcript =
 *   events before the rewound invocation
 *   + events after the rewind marker (the continued branch)
 *
 * Does NOT mutate Postgres — display filter only.
 */
export function filterActiveAdkEvents(events: AdkEvent[]): AdkEvent[] {
  if (events.length === 0) return [];

  const rawEvents = events as RawAdkEvent[];

  let latestRewindMarkerIndex = -1;
  let latestRewindBeforeId: string | null = null;
  for (let i = rawEvents.length - 1; i >= 0; i--) {
    const rewindId = getRewindBeforeInvocationId(rawEvents[i]);
    if (rewindId) {
      latestRewindMarkerIndex = i;
      latestRewindBeforeId = rewindId;
      break;
    }
  }

  if (!latestRewindBeforeId || latestRewindMarkerIndex < 0) {
    return rawEvents.filter(event => !isRewindMarkerEvent(event));
  }

  const beforeMarker = rawEvents.slice(0, latestRewindMarkerIndex).filter(event => !isRewindMarkerEvent(event));
  const afterMarker = rawEvents.slice(latestRewindMarkerIndex + 1).filter(event => !isRewindMarkerEvent(event));

  const cutoffIndex = beforeMarker.findIndex(event => getEventInvocationId(event) === latestRewindBeforeId);
  const prefix = cutoffIndex === -1 ? beforeMarker : beforeMarker.slice(0, cutoffIndex);

  return [...prefix, ...afterMarker];
}
