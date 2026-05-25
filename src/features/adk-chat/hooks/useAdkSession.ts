"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createSessionAction, deleteSessionAction, listSessionsAction, type ActiveSession, type SessionListResult } from "../actions";
import { UNTITLED_THREAD_TITLE } from "../constants";
import type { UnibotSessionKind } from "../session-metadata";
import { getRegistryRow, getSubsForMain, removeRegistrySessions, setSessionRegistry, upsertRegistryRow } from "../session-registry";
import {
  deleteUnibotAdkSessionRegistryAction,
  listUnibotAdkSessionsAction,
  registerUnibotAdkSessionAction,
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
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false);
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
        const result = await createSessionAction(userId);
        if (result.success && result.sessionId) {
          const reg = await registerUnibotAdkSessionAction({
            adk_session_id: result.sessionId,
            kind: "main",
            title: UNTITLED_THREAD_TITLE,
          });
          if (reg.success && reg.session) {
            upsertRegistryRow(reg.session);
          }
          setSessionId(result.sessionId);
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
    [userId, refreshSessions]
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

      const remainingSessions = previousSessions.filter(s => !optimisticIds.has(s.id));
      setSessions(remainingSessions);
      removeRegistrySessions(optimisticIds);

      if (optimisticIds.has(previousSessionId)) {
        const nextSessionId = pickLatestSessionId(remainingSessions);
        setSessionId(nextSessionId || "");
      }

      try {
        const regResult = await deleteUnibotAdkSessionRegistryAction(sessionIdToDelete);
        const adkIds = regResult.adk_session_ids_to_delete.length ? regResult.adk_session_ids_to_delete : Array.from(optimisticIds);

        const adkResults = await Promise.allSettled(adkIds.map(id => deleteSessionAction(userId, id)));
        const failedIds = adkIds.filter((_, i) => {
          const r = adkResults[i];
          return r.status === "rejected" || (r.status === "fulfilled" && !r.value.success);
        });
        if (failedIds.length > 0) {
          markSessionsLocallyDeleted(userId, failedIds);
        }

        if (optimisticIds.has(previousSessionId) && remainingSessions.length === 0) {
          const created = await createSessionAction(userId);
          if (created.success && created.sessionId) {
            await registerUnibotAdkSessionAction({
              adk_session_id: created.sessionId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
            });
            setSessionId(created.sessionId);
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
          const pickedId = pickLatestSessionId(filtered);
          setSessionId(pickedId);
          if (!getRegistryRow(pickedId)) {
            const reg = await registerUnibotAdkSessionAction({
              adk_session_id: pickedId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
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
            });
            setSessionId(created.sessionId);
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
