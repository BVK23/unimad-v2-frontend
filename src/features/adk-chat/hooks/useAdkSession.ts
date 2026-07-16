"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ActiveSession } from "../actions";
import { createSessionAction, deleteSessionAction, listSessionsAction, type SessionListResult } from "../actions";
import { clearPersistedActiveSessionId, loadPersistedActiveSessionId, persistActiveSessionId } from "../active-session-persist";
import { UNTITLED_THREAD_TITLE } from "../constants";
import { findReusableUntitledMainSession } from "../main-session-activity";
import { resolveAdkSessionOptionsForRegistryRow, resolveAdkSessionOptionsForSessionId } from "../resolve-sub-session-adk-app";
import type { AdkSessionServiceOptions } from "../session-history";
import type { UnibotSessionKind } from "../session-metadata";
import { clearAllSessionMutatingToolTracking } from "../session-mutating-tool-tracker";
import { getRegistryRow, getSubsForMain, removeRegistrySessions, setSessionRegistry, upsertRegistryRow } from "../session-registry";
import {
  deleteUnibotAdkSessionRegistryAction,
  listUnibotAdkSessionsAction,
  registerUnibotAdkSessionAction,
  type UnibotAdkSessionDeleteTarget,
} from "../unibot-adk-session-actions";

function getDeletedSessionsStorageKey(userId: string): string {
  return `unimad_deleted_adk_sessions:${userId}`;
}

function getLocallyDeletedSessionIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set<string>();
  try {
    const raw = window.localStorage.getItem(getDeletedSessionsStorageKey(userId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set<string>();
  }
}

function markSessionsLocallyDeleted(userId: string, sessionIds: string[]): void {
  if (typeof window === "undefined" || !userId || sessionIds.length === 0) return;
  const deletedIds = getLocallyDeletedSessionIds(userId);
  sessionIds.forEach(id => deletedIds.add(id));
  window.localStorage.setItem(getDeletedSessionsStorageKey(userId), JSON.stringify(Array.from(deletedIds)));
}

function filterDeletedSessions(sessions: ActiveSession[], userId: string): ActiveSession[] {
  const deletedIds = getLocallyDeletedSessionIds(userId);
  if (deletedIds.size === 0) return sessions;
  return sessions.filter(session => !deletedIds.has(session.id));
}

function normalizeSessionsFromAction(result: SessionListResult): ActiveSession[] {
  if (!result.success) return [];
  return result.sessions.map(s => ({
    ...s,
    lastUpdateTime:
      s.lastUpdateTime instanceof Date
        ? s.lastUpdateTime
        : s.lastUpdateTime != null
          ? new Date(s.lastUpdateTime as unknown as string)
          : null,
  }));
}

function pickLatestSessionId(sessions: ActiveSession[]): string {
  if (sessions.length === 0) return "";
  const sorted = [...sessions].sort((a, b) => {
    const ta = a.lastUpdateTime?.getTime() ?? 0;
    const tb = b.lastUpdateTime?.getTime() ?? 0;
    return tb - ta;
  });
  return sorted[0].id;
}

function resolveInitialMainSessionId(userId: string, sessions: ActiveSession[]): string {
  const persisted = loadPersistedActiveSessionId(userId);
  if (persisted) {
    const row = getRegistryRow(persisted);
    if (row?.kind === "sub" && row.parent_adk_session_id) {
      if (sessions.some(s => s.id === row.parent_adk_session_id)) {
        return row.parent_adk_session_id;
      }
    } else if (sessions.some(s => s.id === persisted)) {
      return persisted;
    }
  }
  return pickLatestSessionId(sessions);
}

export interface UseAdkSessionReturn {
  sessionId: string;
  sessions: ActiveSession[];
  isBootstrappingSession: boolean;
  sessionError: string | null;
  refreshSessions: () => Promise<void>;
  refreshRegistry: () => Promise<void>;
  handleSessionSwitch: (newSessionId: string) => void;
  handleCreateNewSession: (options?: { kind?: UnibotSessionKind; parentSessionId?: string }) => Promise<void>;
  handleDeleteSession: (sessionIdToDelete: string) => Promise<void>;
}

/**
 * ADK sessions + Django registry: load both once, merge for sidebar history.
 */
export function useAdkSession(userId: string): UseAdkSessionReturn {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(() => Boolean(userId));
  const [sessionError, setSessionError] = useState<string | null>(null);
  const prevUserIdRef = useRef<string>("");

  const refreshRegistry = useCallback(async (): Promise<void> => {
    const result = await listUnibotAdkSessionsAction();
    if (result.success) {
      setSessionRegistry(result.sessions);
    }
  }, []);

  const refreshSessions = useCallback(async (): Promise<void> => {
    if (!userId) {
      setSessions([]);
      return;
    }
    await refreshRegistry();
    const result = await listSessionsAction(userId);
    setSessions(filterDeletedSessions(normalizeSessionsFromAction(result), userId));
  }, [userId, refreshRegistry]);

  const handleSessionSwitch = useCallback(
    (newSessionId: string): void => {
      if (!userId || !newSessionId || newSessionId === sessionId) return;
      setSessionId(newSessionId);
      persistActiveSessionId(userId, newSessionId);
    },
    [userId, sessionId]
  );

  const handleCreateNewSession = useCallback(
    async (options?: { kind?: UnibotSessionKind; parentSessionId?: string }): Promise<void> => {
      if (!userId) {
        throw new Error("User ID is required to create a session");
      }
      const kind = options?.kind ?? "main";
      if (kind === "sub") {
        throw new Error("Use register sub flow with feature/section/entry_id for sub-sessions");
      }

      setIsBootstrappingSession(true);
      setSessionError(null);
      try {
        const reusableId = findReusableUntitledMainSession(userId, sessions);
        if (reusableId) {
          setSessionId(reusableId);
          persistActiveSessionId(userId, reusableId);
          return;
        }

        const result = await createSessionAction(userId);
        if (result.success && result.sessionId) {
          const reg = await registerUnibotAdkSessionAction({
            adk_session_id: result.sessionId,
            kind: "main",
            title: UNTITLED_THREAD_TITLE,
            content_key: `general:${result.sessionId}`,
          });
          if (reg.success && reg.session) {
            upsertRegistryRow(reg.session);
          }
          setSessionId(result.sessionId);
          persistActiveSessionId(userId, result.sessionId);
          await refreshSessions();
        } else {
          throw new Error(result.error || "Session creation failed");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setSessionError(msg);
        throw e;
      } finally {
        setIsBootstrappingSession(false);
      }
    },
    [userId, refreshSessions, sessions]
  );

  const handleDeleteSession = useCallback(
    async (sessionIdToDelete: string): Promise<void> => {
      if (!userId || !sessionIdToDelete) {
        throw new Error("User ID and session ID are required to delete a session");
      }

      const previousSessionId = sessionId;
      const previousSessions = sessions;

      const row = getRegistryRow(sessionIdToDelete);
      const optimisticIds = new Set<string>([sessionIdToDelete]);
      if (row?.kind === "main") {
        getSubsForMain(sessionIdToDelete).forEach(s => optimisticIds.add(s.adk_session_id));
      }

      // Capture ADK app options before clearing the in-memory registry (subs live under
      // coverletter / resume_* / etc., not the default unibot app).
      const deleteOptionsById = new Map<string, AdkSessionServiceOptions>();
      for (const id of optimisticIds) {
        deleteOptionsById.set(id, resolveAdkSessionOptionsForSessionId(id));
      }

      const remainingSessions = previousSessions.filter(s => !optimisticIds.has(s.id));
      setSessions(remainingSessions);
      removeRegistrySessions(optimisticIds);

      if (optimisticIds.has(previousSessionId)) {
        const nextSessionId = pickLatestSessionId(remainingSessions);
        setSessionId(nextSessionId || "");
        if (nextSessionId) {
          persistActiveSessionId(userId, nextSessionId);
        } else {
          clearPersistedActiveSessionId(userId);
        }
      }

      try {
        const regResult = await deleteUnibotAdkSessionRegistryAction(sessionIdToDelete);
        const targets: UnibotAdkSessionDeleteTarget[] =
          regResult.sessions_to_delete.length > 0
            ? regResult.sessions_to_delete
            : (regResult.adk_session_ids_to_delete.length ? regResult.adk_session_ids_to_delete : Array.from(optimisticIds)).map(id => ({
                adk_session_id: id,
                kind: "main",
              }));

        for (const target of targets) {
          if (deleteOptionsById.has(target.adk_session_id)) continue;
          deleteOptionsById.set(
            target.adk_session_id,
            resolveAdkSessionOptionsForRegistryRow({
              kind: (target.kind === "sub" ? "sub" : "main") as UnibotSessionKind,
              feature: target.feature ?? null,
              section: target.section ?? null,
            })
          );
        }

        const adkIds = targets.map(t => t.adk_session_id);
        const adkResults = await Promise.allSettled(adkIds.map(id => deleteSessionAction(userId, id, deleteOptionsById.get(id) ?? {})));
        const failedIds = adkIds.filter((_, i) => {
          const r = adkResults[i];
          return r.status === "rejected" || (r.status === "fulfilled" && !r.value.success);
        });
        if (failedIds.length > 0) {
          markSessionsLocallyDeleted(userId, failedIds);
        }

        clearAllSessionMutatingToolTracking(adkIds);

        if (optimisticIds.has(previousSessionId) && remainingSessions.length === 0) {
          const created = await createSessionAction(userId);
          if (created.success && created.sessionId) {
            await registerUnibotAdkSessionAction({
              adk_session_id: created.sessionId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
              content_key: `general:${created.sessionId}`,
            });
            setSessionId(created.sessionId);
            persistActiveSessionId(userId, created.sessionId);
          } else {
            throw new Error(created.error || "Failed to create a new session after deletion");
          }
        }

        await refreshSessions();
      } catch (e) {
        markSessionsLocallyDeleted(userId, Array.from(optimisticIds));
        throw e;
      }
    },
    [userId, sessionId, sessions, refreshSessions]
  );

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      setSessionId("");
      setSessions([]);
      setSessionRegistry([]);
      setSessionError(null);
    }

    if (!userId) {
      setIsBootstrappingSession(false);
      return;
    }

    let cancelled = false;
    setIsBootstrappingSession(true);
    setSessionError(null);

    void (async () => {
      try {
        const [registryResult, listResult] = await Promise.all([listUnibotAdkSessionsAction(), listSessionsAction(userId)]);
        if (cancelled) return;

        if (registryResult.success) {
          setSessionRegistry(registryResult.sessions);
        }

        const normalized = normalizeSessionsFromAction(listResult);
        const filtered = filterDeletedSessions(normalized, userId);
        setSessions(filtered);

        if (filtered.length > 0) {
          const pickedId = resolveInitialMainSessionId(userId, filtered);
          setSessionId(pickedId);
          persistActiveSessionId(userId, pickedId);
          if (!getRegistryRow(pickedId)) {
            const reg = await registerUnibotAdkSessionAction({
              adk_session_id: pickedId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
              content_key: `general:${pickedId}`,
            });
            if (!cancelled && reg.success && reg.session) {
              upsertRegistryRow(reg.session);
            }
          }
        } else {
          const created = await createSessionAction(userId);
          if (cancelled) return;
          if (created.success && created.sessionId) {
            await registerUnibotAdkSessionAction({
              adk_session_id: created.sessionId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
              content_key: `general:${created.sessionId}`,
            });
            setSessionId(created.sessionId);
            persistActiveSessionId(userId, created.sessionId);
            const again = await listSessionsAction(userId);
            if (!cancelled) {
              setSessions(filterDeletedSessions(normalizeSessionsFromAction(again), userId));
              await refreshRegistry();
            }
          } else {
            setSessionError(created.error || "Session creation failed");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setSessionError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setIsBootstrappingSession(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, refreshRegistry]);

  return {
    sessionId,
    sessions,
    isBootstrappingSession,
    sessionError,
    refreshSessions,
    refreshRegistry,
    handleSessionSwitch,
    handleCreateNewSession,
    handleDeleteSession,
  };
}
