/**
 * Sidebar grouping for Unibot ADK sessions.
 * Source of truth: Django registry (`session-registry.ts`), not localStorage.
 */
import { isUntitledMainSessionTitle, mainSessionDisplayTitle, UNTITLED_THREAD_TITLE } from "./constants";
import { getRegistryRow, getSessionRegistry, registryRowToMeta, type UnibotSessionKind } from "./session-registry";

export { NEW_THREAD_DISPLAY_TITLE, UNTITLED_THREAD_TITLE, isUntitledMainSessionTitle, mainSessionDisplayTitle } from "./constants";

export type { UnibotSessionKind };

export interface UnibotSessionMeta {
  kind: UnibotSessionKind;
  displayName: string;
  parentSessionId?: string;
}

export function getSessionMeta(_userId: string, sessionId: string): UnibotSessionMeta | null {
  const row = getRegistryRow(sessionId);
  if (!row) return null;
  return registryRowToMeta(row);
}

/** Main sessions are deletable once they have a generated title (not the untitled placeholder). */
export function canDeleteMainChatSession(sessionId: string): boolean {
  const row = getRegistryRow(sessionId);
  const title = row?.title?.trim();
  return Boolean(title && !isUntitledMainSessionTitle(title));
}

export function getSessionDisplayName(_userId: string, sessionId: string, fallback?: string): string {
  const row = getRegistryRow(sessionId);
  return mainSessionDisplayTitle(row?.title ?? fallback);
}

export interface GroupedAdkSession {
  id: string;
  title: string;
  kind: UnibotSessionKind;
  subs: { id: string; title: string }[];
  /** False for empty / untitled sessions shown as "New chat". */
  canDelete: boolean;
}

export function groupSessionsForSidebar(
  _userId: string,
  sessions: { id: string; title?: string; lastUpdateTime?: Date | null }[]
): GroupedAdkSession[] {
  const registry = getSessionRegistry();
  const adkIds = new Set(sessions.map(s => s.id));
  const subsByParent = new Map<string, { id: string; title: string }[]>();

  for (const row of registry) {
    if (row.kind !== "sub" || !row.parent_adk_session_id) continue;
    if (!adkIds.has(row.adk_session_id)) continue;
    const list = subsByParent.get(row.parent_adk_session_id) ?? [];
    list.push({ id: row.adk_session_id, title: row.title?.trim() || "Improve thread" });
    subsByParent.set(row.parent_adk_session_id, list);
  }

  const mains: GroupedAdkSession[] = [];
  const seenMainIds = new Set<string>();

  for (const session of sessions) {
    const row = getRegistryRow(session.id);
    if (row?.kind === "sub") continue;
    if (seenMainIds.has(session.id)) continue;
    seenMainIds.add(session.id);
    mains.push({
      id: session.id,
      title: mainSessionDisplayTitle(row?.title),
      kind: "main",
      subs: subsByParent.get(session.id) ?? [],
      canDelete: canDeleteMainChatSession(session.id),
    });
  }

  for (const row of registry) {
    if (row.kind !== "main") continue;
    if (!adkIds.has(row.adk_session_id)) continue;
    if (seenMainIds.has(row.adk_session_id)) continue;
    seenMainIds.add(row.adk_session_id);
    mains.push({
      id: row.adk_session_id,
      title: mainSessionDisplayTitle(row.title),
      kind: "main",
      subs: subsByParent.get(row.adk_session_id) ?? [],
      canDelete: canDeleteMainChatSession(row.adk_session_id),
    });
  }

  return mains.sort((a, b) => {
    const ta = sessions.find(s => s.id === a.id)?.lastUpdateTime?.getTime() ?? 0;
    const tb = sessions.find(s => s.id === b.id)?.lastUpdateTime?.getTime() ?? 0;
    return tb - ta;
  });
}

/** Human-readable sub-session label before registry row exists. */
export function buildImproveSubSessionTitle(section: string, entryIndex?: number | null): string {
  const sectionLabel = section
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const base = `Resume · ${sectionLabel} Improvement`;
  if (entryIndex != null && entryIndex >= 1) {
    return `${base} (${entryIndex})`;
  }
  return base;
}
