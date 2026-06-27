/**
 * Synchronous stream-activity snapshot for useSyncExternalStore.
 * Window events + React setState lag behind the SSE pump; this updates in the same tick as each hint.
 */

export type StreamActivitySnapshot = {
  activityLabel: string | null;
  assistantMessageId: string | null;
};

let snapshot: StreamActivitySnapshot = {
  activityLabel: null,
  assistantMessageId: null,
};

const listeners = new Set<() => void>();

export function getStreamActivitySnapshot(): StreamActivitySnapshot {
  return snapshot;
}

export function subscribeStreamActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setStreamActivitySnapshot(next: StreamActivitySnapshot): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export function clearStreamActivitySnapshot(): void {
  setStreamActivitySnapshot({ activityLabel: null, assistantMessageId: null });
}
