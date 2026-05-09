"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createSessionAction, deleteSessionAction, listSessionsAction, type ActiveSession, type SessionListResult } from "../actions";

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

function markSessionLocallyDeleted(userId: string, sessionId: string): void {
  if (typeof window === "undefined" || !userId || !sessionId) return;
  const deletedIds = getLocallyDeletedSessionIds(userId);
  deletedIds.add(sessionId);
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
  handleSessionSwitch: (newSessionId: string) => void;
  handleCreateNewSession: () => Promise<void>;
  handleDeleteSession: (sessionIdToDelete: string) => Promise<void>;
}

/**
 * ADK sessions for one app user: list existing → reuse latest, or create first session.
 * `userId` is the ADK user key (username / email from your app).
 */
export function useAdkSession(userId: string): UseAdkSessionReturn {
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const prevUserIdRef = useRef<string>("");

  const refreshSessions = useCallback(async (): Promise<void> => {
    if (!userId) {
      setSessions([]);
      return;
    }
    const result = await listSessionsAction(userId);
    setSessions(filterDeletedSessions(normalizeSessionsFromAction(result), userId));
  }, [userId]);

  const handleSessionSwitch = useCallback(
    (newSessionId: string): void => {
      if (!userId || !newSessionId || newSessionId === sessionId) return;
      setSessionId(newSessionId);
    },
    [userId, sessionId]
  );

  const handleCreateNewSession = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error("User ID is required to create a session");
    }
    setIsBootstrappingSession(true);
    setSessionError(null);
    try {
      const result = await createSessionAction(userId);
      if (result.success && result.sessionId) {
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
  }, [userId, refreshSessions]);

  const handleDeleteSession = useCallback(
    async (sessionIdToDelete: string): Promise<void> => {
      if (!userId || !sessionIdToDelete) {
        throw new Error("User ID and session ID are required to delete a session");
      }

      const previousSessionId = sessionId;
      const previousSessions = sessions;
      const remainingSessions = previousSessions.filter(s => s.id !== sessionIdToDelete);

      setSessions(remainingSessions);

      if (previousSessionId === sessionIdToDelete) {
        const nextSessionId = pickLatestSessionId(remainingSessions);
        if (nextSessionId) {
          setSessionId(nextSessionId);
        } else {
          setSessionId("");
        }
      }

      const result = await deleteSessionAction(userId, sessionIdToDelete);
      if (!result.success) {
        markSessionLocallyDeleted(userId, sessionIdToDelete);
      }

      if (previousSessionId === sessionIdToDelete && remainingSessions.length === 0) {
        const created = await createSessionAction(userId);
        if (created.success && created.sessionId) {
          setSessionId(created.sessionId);
        } else {
          throw new Error(created.error || "Failed to create a new session after deletion");
        }
      }

      await refreshSessions();
    },
    [userId, sessionId, sessions, refreshSessions]
  );

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      setSessionId("");
      setSessions([]);
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
        const listResult = await listSessionsAction(userId);
        if (cancelled) return;

        const normalized = normalizeSessionsFromAction(listResult);
        const filtered = filterDeletedSessions(normalized, userId);
        setSessions(filtered);

        if (filtered.length > 0) {
          setSessionId(pickLatestSessionId(filtered));
        } else {
          const created = await createSessionAction(userId);
          if (cancelled) return;
          if (created.success && created.sessionId) {
            setSessionId(created.sessionId);
            const again = await listSessionsAction(userId);
            if (!cancelled) {
              setSessions(normalizeSessionsFromAction(again));
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
  }, [userId]);

  return {
    sessionId,
    sessions,
    isBootstrappingSession,
    sessionError,
    refreshSessions,
    handleSessionSwitch,
    handleCreateNewSession,
    handleDeleteSession,
  };
}
