"use client";

const ACTIVE_SESSION_KEY_PREFIX = "unimad_active_adk_session:";

export function getActiveSessionStorageKey(userId: string): string {
  return `${ACTIVE_SESSION_KEY_PREFIX}${userId}`;
}

export function loadPersistedActiveSessionId(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getActiveSessionStorageKey(userId));
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function persistActiveSessionId(userId: string, sessionId: string): void {
  if (typeof window === "undefined" || !userId || !sessionId) return;
  try {
    window.localStorage.setItem(getActiveSessionStorageKey(userId), sessionId);
  } catch {
    /* ignore */
  }
}

export function clearPersistedActiveSessionId(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(getActiveSessionStorageKey(userId));
  } catch {
    /* ignore */
  }
}
