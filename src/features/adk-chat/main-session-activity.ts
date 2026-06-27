"use client";

import type { ActiveSession } from "./actions";
import { isUntitledMainSessionTitle } from "./constants";
import { getRegistryRow, getSessionRegistry } from "./session-registry";

function storageKey(userId: string): string {
  return `unimad_main_session_user_prompts:${userId}`;
}

function readPromptSet(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set();
  }
}

function writePromptSet(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(ids)));
}

/** Main thread received at least one user message (not sub-thread only). */
export function mainSessionHasUserPrompt(userId: string, sessionId: string): boolean {
  if (!userId || !sessionId) return false;
  return readPromptSet(userId).has(sessionId);
}

export function markMainSessionHasUserPrompt(userId: string, sessionId: string): void {
  if (!userId || !sessionId) return;
  const ids = readPromptSet(userId);
  if (ids.has(sessionId)) return;
  ids.add(sessionId);
  writePromptSet(userId, ids);
}

/**
 * Untitled main with no user prompts yet — may already host sub-threads.
 * Reuse instead of creating duplicate "New Thread" rows.
 */
export function findReusableUntitledMainSession(userId: string, sessions: ActiveSession[]): string | null {
  if (!userId) return null;
  const adkIds = new Set(sessions.map(s => s.id));
  const prompted = readPromptSet(userId);

  const candidates = getSessionRegistry()
    .filter(row => row.kind === "main")
    .filter(row => isUntitledMainSessionTitle(row.title))
    .filter(row => adkIds.has(row.adk_session_id))
    .filter(row => !prompted.has(row.adk_session_id));

  if (candidates.length === 0) return null;

  const byRecency = [...candidates].sort((a, b) => {
    const ta = sessions.find(s => s.id === a.adk_session_id)?.lastUpdateTime?.getTime() ?? 0;
    const tb = sessions.find(s => s.id === b.adk_session_id)?.lastUpdateTime?.getTime() ?? 0;
    return tb - ta;
  });

  return byRecency[0]?.adk_session_id ?? null;
}
