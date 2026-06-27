"use server";

import { convertAdkEventsToMessages } from "./message-converter";
import { createSessionWithService, type SessionCreationOptions, type SessionCreationResult } from "./services";
import {
  getSessionWithEvents,
  listUserSessions,
  AdkSessionService,
  resolveEffectiveAdkAppForSession,
  type AdkSessionServiceOptions,
} from "./session-history";
import type { AgentMessage, ProcessedEvent } from "./types";

export async function createSessionAction(userId: string, options?: SessionCreationOptions): Promise<SessionCreationResult> {
  try {
    return await createSessionWithService(userId, options);
  } catch (error) {
    console.error("createSessionAction error:", error);
    return {
      success: false,
      sessionId: "",
      created: false,
      error: `Server Action error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export interface ActiveSession {
  id: string;
  userId: string;
  appName: string;
  lastUpdateTime: Date | null;
  messageCount: number;
  title?: string;
}

export interface SessionListResult {
  success: boolean;
  sessions: ActiveSession[];
  error?: string;
}

export interface SessionDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * List sessions for the user only (no per-session event fetch). Use for sidebar history.
 */
export async function listSessionsAction(userId: string): Promise<SessionListResult> {
  try {
    const result = await listUserSessions(userId);
    const sessions: ActiveSession[] = result.sessions
      .filter((s): s is typeof s & { id: string } => Boolean(s.id))
      .map(session => ({
        id: session.id,
        userId: session.user_id,
        appName: session.app_name,
        lastUpdateTime: session.last_update_time ? new Date(session.last_update_time) : null,
        messageCount: 0,
        title: `Chat ${session.id.substring(0, 8)}…`,
      }));

    return { success: true, sessions };
  } catch (error) {
    console.error("listSessionsAction error:", error);
    return {
      success: false,
      sessions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchActiveSessionsAction(userId: string): Promise<SessionListResult> {
  try {
    const result = await listUserSessions(userId);

    const sessionDetailsPromises = result.sessions
      .filter((s): s is typeof s & { id: string } => Boolean(s.id))
      .map(async session => {
        try {
          const sessionWithEvents = await getSessionWithEvents(userId, session.id);
          const messageCount = sessionWithEvents?.events?.length || 0;

          return {
            id: session.id,
            userId: session.user_id,
            appName: session.app_name,
            lastUpdateTime: session.last_update_time ? new Date(session.last_update_time) : null,
            messageCount,
            title: `Session ${session.id.substring(0, 8)}`,
          };
        } catch {
          return {
            id: session.id,
            userId: session.user_id,
            appName: session.app_name,
            lastUpdateTime: session.last_update_time ? new Date(session.last_update_time) : null,
            messageCount: 0,
            title: `Session ${session.id.substring(0, 8)}`,
          };
        }
      });

    const activeSessions: ActiveSession[] = await Promise.all(sessionDetailsPromises);

    return {
      success: true,
      sessions: activeSessions,
    };
  } catch (error) {
    console.error("fetchActiveSessionsAction error:", error);
    return {
      success: false,
      sessions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteSessionAction(
  userId: string,
  sessionId: string,
  options?: AdkSessionServiceOptions
): Promise<SessionDeleteResult> {
  try {
    if (!userId || !sessionId) {
      return {
        success: false,
        error: "userId and sessionId are required",
      };
    }
    await AdkSessionService.deleteSession(userId, sessionId, options);
    return { success: true };
  } catch (error) {
    console.error("deleteSessionAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Serializable replacement for Map over the server action boundary */
export interface SessionHistoryResult {
  success: boolean;
  messages: AgentMessage[];
  messageEventsEntries: [string, ProcessedEvent[]][];
  error?: string;
}

export async function loadSessionHistoryAction(
  userId: string,
  sessionId: string,
  options?: AdkSessionServiceOptions
): Promise<SessionHistoryResult> {
  try {
    const sessionWithEvents = await getSessionWithEvents(userId, sessionId, options);

    if (!sessionWithEvents) {
      return {
        success: true,
        messages: [],
        messageEventsEntries: [],
      };
    }

    const { messages: historicalMessages } = convertAdkEventsToMessages(sessionWithEvents.events || []);

    const messageEvents = new Map<string, ProcessedEvent[]>();
    historicalMessages.forEach(message => {
      if (message.timelineActivities && message.timelineActivities.length > 0) {
        const processedEvents: ProcessedEvent[] = message.timelineActivities.map(activity => {
          if (
            activity.metadata &&
            typeof activity.metadata === "object" &&
            "type" in activity.metadata &&
            activity.metadata.type === "thinking"
          ) {
            return {
              title: activity.title,
              data: {
                type: "thinking",
                content: activity.metadata.content || "",
              },
            };
          }
          return {
            title: activity.title,
            data: {
              type: activity.type,
              agent: activity.agent,
              timestamp: activity.timestamp,
              metadata: activity.metadata,
            },
          };
        });
        messageEvents.set(message.id, processedEvents);
      }
    });

    return {
      success: true,
      messages: historicalMessages,
      messageEventsEntries: Array.from(messageEvents.entries()),
    };
  } catch (error) {
    console.error("loadSessionHistoryAction error:", error);
    return {
      success: false,
      messages: [],
      messageEventsEntries: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface SessionStateSyncResult {
  success: boolean;
  patched: boolean;
  patchSupported: boolean;
  effectiveAppName?: string;
  error?: string;
}

export interface SessionStatePullResult {
  success: boolean;
  state: Record<string, unknown> | null;
  error?: string;
}

export async function syncSessionStateAction(
  userId: string,
  sessionId: string,
  stateDelta: Record<string, unknown>,
  options?: AdkSessionServiceOptions
): Promise<SessionStateSyncResult> {
  try {
    if (!userId || !sessionId) {
      return {
        success: false,
        patched: false,
        patchSupported: false,
        error: "userId and sessionId are required",
      };
    }

    if (!stateDelta || Object.keys(stateDelta).length === 0) {
      const effectiveAppName = await resolveEffectiveAdkAppForSession(userId, sessionId, options);
      return {
        success: true,
        patched: false,
        patchSupported: true,
        effectiveAppName,
      };
    }

    const patchResult = await AdkSessionService.patchSessionState(userId, sessionId, stateDelta, options);
    const effectiveAppName = await resolveEffectiveAdkAppForSession(userId, sessionId, options);
    return {
      success: !patchResult.error,
      patched: patchResult.patched,
      patchSupported: patchResult.patchSupported,
      effectiveAppName,
      ...(patchResult.error ? { error: patchResult.error } : {}),
    };
  } catch (error) {
    return {
      success: false,
      patched: false,
      patchSupported: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface SessionRewindResult {
  success: boolean;
  error?: string;
}

export async function rewindSessionAction(
  userId: string,
  sessionId: string,
  rewindBeforeInvocationId: string,
  options?: AdkSessionServiceOptions
): Promise<SessionRewindResult> {
  try {
    if (!userId || !sessionId || !rewindBeforeInvocationId.trim()) {
      return {
        success: false,
        error: "userId, sessionId, and rewindBeforeInvocationId are required",
      };
    }

    return await AdkSessionService.rewindSession(userId, sessionId, rewindBeforeInvocationId.trim(), options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function pullSessionStateAction(
  userId: string,
  sessionId: string,
  options?: AdkSessionServiceOptions
): Promise<SessionStatePullResult> {
  try {
    if (!userId || !sessionId) {
      return {
        success: false,
        state: null,
        error: "userId and sessionId are required",
      };
    }

    const session = await AdkSessionService.getSession(userId, sessionId, options);
    return {
      success: true,
      state: session?.state ?? null,
    };
  } catch (error) {
    return {
      success: false,
      state: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
