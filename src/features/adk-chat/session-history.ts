import { getAdkAppName, resolveAdkAppName } from "./adk-app-names";
import { getEndpointForPath, getAuthHeaders, shouldUseAgentEngine } from "./config";
import type { AdkSession, AdkSessionWithEvents, ListSessionsResponse, ListEventsResponse } from "./types";

/**
 * ADK Session History Service - Handles session and event retrieval for chat history
 * Simplified approach using smart endpoint routing (like web project)
 *
 * This service provides:
 * - Session retrieval by ID
 * - Event listing for sessions
 * - Combined session + events for historical loading
 * - Support for both Agent Engine and Local Backend deployments
 */

export type AdkSessionServiceOptions = {
  appName?: string;
  /** Retry with this app when the primary returns 404 (legacy sub-sessions created under `app`). */
  fallbackAppName?: string;
};

async function fetchSessionFromBackend(
  userId: string,
  sessionId: string,
  appName: string
): Promise<{ session: AdkSession | null; notFound: boolean }> {
  const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
  const authHeaders = await getAuthHeaders();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      ...authHeaders,
    },
  });

  if (response.status === 404) {
    return { session: null, notFound: true };
  }

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return { session: await response.json(), notFound: false };
}

/** Which ADK app owns this session (primary sub-app, or legacy `app` fallback). */
export async function resolveEffectiveAdkAppForSession(
  userId: string,
  sessionId: string,
  options?: AdkSessionServiceOptions
): Promise<string> {
  const primary = resolveAdkAppName(options?.appName);
  if (shouldUseAgentEngine()) {
    return primary;
  }
  const first = await fetchSessionFromBackend(userId, sessionId, primary);
  if (first.session) {
    return primary;
  }
  const fallback = options?.fallbackAppName?.trim();
  if (first.notFound && fallback && fallback !== primary) {
    const retry = await fetchSessionFromBackend(userId, sessionId, fallback);
    if (retry.session) {
      return fallback;
    }
  }
  return primary;
}

/**
 * ADK Session Service - Handles all session-related API calls
 * Uses smart endpoint routing to work with both local backend and Agent Engine
 */
export class AdkSessionService {
  private static localSessionPatchSupported: boolean | null = null;

  /**
   * Retrieves a specific session by ID
   */
  static async getSession(userId: string, sessionId: string, options?: AdkSessionServiceOptions): Promise<AdkSession | null> {
    const appName = resolveAdkAppName(options?.appName);

    if (shouldUseAgentEngine()) {
      // Agent Engine: Use v1beta1 sessions API
      const endpoint = getEndpointForPath(`/${sessionId}`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to get session: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Agent Engine getSession error:", error);
        throw error;
      }
    } else {
      const primaryApp = resolveAdkAppName(options?.appName);
      try {
        const primary = await fetchSessionFromBackend(userId, sessionId, primaryApp);
        if (primary.session) {
          return primary.session;
        }
        const fallback = options?.fallbackAppName?.trim();
        if (primary.notFound && fallback && fallback !== primaryApp) {
          const retry = await fetchSessionFromBackend(userId, sessionId, fallback);
          return retry.session;
        }
        return null;
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Local Backend getSession error:", error);
        throw error;
      }
    }
  }

  /**
   * Lists all sessions for a user
   */
  static async listSessions(userId: string): Promise<ListSessionsResponse> {
    const appName = getAdkAppName();

    if (shouldUseAgentEngine()) {
      // Agent Engine: Use v1beta1 sessions API
      const endpoint = getEndpointForPath("", "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Agent Engine sessions API returns sessions with 'name' field, need to extract ID
        const rawSessions = responseData.sessions || responseData || [];
        const sessions: AdkSession[] = rawSessions.map(
          (session: { name?: string; createTime?: string; updateTime?: string; userId?: string }) => {
            // Extract session ID from name field: "projects/.../sessions/SESSION_ID"
            const sessionId = session.name ? session.name.split("/sessions/")[1] : null;

            return {
              id: sessionId,
              app_name: getAdkAppName(), // Add app_name for compatibility
              user_id: session.userId,
              state: null,
              last_update_time: session.updateTime || session.createTime,
              // Keep original fields for reference
              name: session.name,
              createTime: session.createTime,
              updateTime: session.updateTime,
            };
          }
        );

        const validSessions = (Array.isArray(sessions) ? sessions : []).filter((s): s is AdkSession & { id: string } => Boolean(s.id));

        return {
          sessions: validSessions,
          sessionIds: validSessions.map(session => session.id),
        };
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Agent Engine listSessions error:", error);
        throw error;
      }
    } else {
      // Local Backend: GET with path
      const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions`);

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const sessions: AdkSession[] = await response.json();

        return {
          sessions,
          sessionIds: sessions.map(session => session.id).filter((id): id is string => Boolean(id)),
        };
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Local Backend error:", error);
        throw error;
      }
    }
  }

  /**
   * Deletes a specific session by ID.
   * Tries primary app, then optional fallback (legacy sub-sessions stored under unibot).
   */
  static async deleteSession(userId: string, sessionId: string, options?: AdkSessionServiceOptions): Promise<void> {
    if (shouldUseAgentEngine()) {
      const endpoint = getEndpointForPath(`/${sessionId}`, "sessions");
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "DELETE",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete session: ${response.statusText}`);
        }
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Agent Engine deleteSession error:", error);
        throw error;
      }
      return;
    }

    const primaryApp = resolveAdkAppName(options?.appName);
    const fallback = options?.fallbackAppName?.trim();

    const attemptDelete = async (appName: string): Promise<Response> => {
      const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
      const authHeaders = await getAuthHeaders();
      return fetch(endpoint, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });
    };

    try {
      let response = await attemptDelete(primaryApp);
      if (response.status === 404 && fallback && fallback !== primaryApp) {
        response = await attemptDelete(fallback);
      }

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ [ADK SESSION SERVICE] Local Backend deleteSession error:", error);
      throw error;
    }
  }

  /**
   * Lists all events for a specific session
   */
  static async listEvents(userId: string, sessionId: string, options?: AdkSessionServiceOptions): Promise<ListEventsResponse> {
    const appName = resolveAdkAppName(options?.appName);

    if (shouldUseAgentEngine()) {
      // Agent Engine: Use v1beta1 sessions API
      const endpoint = getEndpointForPath(`/${sessionId}/events`, "sessions");

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list events: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Agent Engine returns events in 'sessionEvents' field, but we need 'events'
        if (responseData && responseData.sessionEvents && Array.isArray(responseData.sessionEvents)) {
          return {
            events: responseData.sessionEvents,
            nextPageToken: responseData.nextPageToken,
          };
        }

        return responseData;
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Agent Engine listEvents error:", error);
        throw error;
      }
    } else {
      // Local Backend: GET with path
      const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}/events`);

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to list events: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error("❌ [ADK SESSION SERVICE] Local Backend listEvents error:", error);
        throw error;
      }
    }
  }

  /**
   * Retrieves a session with all its events (for historical context)
   */
  static async getSessionWithEvents(
    userId: string,
    sessionId: string,
    options?: AdkSessionServiceOptions
  ): Promise<AdkSessionWithEvents | null> {
    try {
      if (shouldUseAgentEngine()) {
        const eventsResponse = await AdkSessionService.listEvents(userId, sessionId, options);
        const events = eventsResponse?.events || [];

        // Create a minimal session object with the events
        const session: AdkSessionWithEvents = {
          id: sessionId,
          user_id: userId,
          app_name: process.env.ADK_APP_NAME || "unibot",
          state: null,
          last_update_time: new Date().toISOString(),
          events: events,
        };

        return session;
      } else {
        const session = await AdkSessionService.getSession(userId, sessionId, options);

        if (!session) {
          return null;
        }

        // Use events directly from session detail (backend includes them)
        const events = session.events || [];

        return {
          ...session,
          events,
        };
      }
    } catch (error) {
      console.error("❌ [ADK SESSION SERVICE] Error fetching session with events:", error);
      throw error;
    }
  }

  /**
   * Rewinds a session to before the given invocation (undoes that turn and everything after).
   * Supported on self-hosted `adk api_server` (local + Cloud Run). Not available on managed Agent Engine.
   */
  static async rewindSession(
    userId: string,
    sessionId: string,
    rewindBeforeInvocationId: string,
    options?: AdkSessionServiceOptions
  ): Promise<{ success: boolean; error?: string }> {
    if (shouldUseAgentEngine()) {
      return {
        success: false,
        error: "Session rewind is not available on managed Agent Engine.",
      };
    }

    const primaryApp = resolveAdkAppName(options?.appName);
    const fallback = options?.fallbackAppName?.trim();

    const attemptRewind = async (appName: string): Promise<Response> => {
      const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}/rewind`);
      const authHeaders = await getAuthHeaders();
      return fetch(endpoint, {
        method: "POST",
        headers: {
          ...authHeaders,
        },
        body: JSON.stringify({
          rewind_before_invocation_id: rewindBeforeInvocationId,
        }),
      });
    };

    try {
      let response = await attemptRewind(primaryApp);
      if (response.status === 404 && fallback && fallback !== primaryApp) {
        response = await attemptRewind(fallback);
      }

      if (!response.ok) {
        let detail = response.statusText;
        try {
          const body = await response.text();
          if (body) detail = body;
        } catch {
          /* ignore */
        }
        return {
          success: false,
          error: `Rewind failed (${response.status}): ${detail}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("❌ [ADK SESSION SERVICE] rewindSession error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Tries to patch local ADK session state. Agent Engine uses a different API path
   * and currently does not use this helper.
   */
  static async patchSessionState(
    userId: string,
    sessionId: string,
    stateDelta: Record<string, unknown>,
    options?: AdkSessionServiceOptions
  ): Promise<{ patched: boolean; patchSupported: boolean; error?: string }> {
    if (shouldUseAgentEngine()) {
      return {
        patched: false,
        patchSupported: false,
      };
    }

    if (AdkSessionService.localSessionPatchSupported === false) {
      return {
        patched: false,
        patchSupported: false,
      };
    }

    const appName = resolveAdkAppName(options?.appName);

    const attemptPatch = async (targetApp: string) => {
      const patchEndpoint = getEndpointForPath(`/apps/${targetApp}/users/${userId}/sessions/${sessionId}`);
      const authHeaders = await getAuthHeaders();
      return fetch(patchEndpoint, {
        method: "PATCH",
        headers: {
          ...authHeaders,
        },
        body: JSON.stringify({
          stateDelta,
        }),
      });
    };

    try {
      let response = await attemptPatch(appName);

      const fallback = options?.fallbackAppName?.trim();
      if (response.status === 404 && fallback && fallback !== appName) {
        response = await attemptPatch(fallback);
      }

      if (response.ok) {
        AdkSessionService.localSessionPatchSupported = true;
        return {
          patched: true,
          patchSupported: true,
        };
      }

      // Older ADK versions do not support this method.
      if (response.status === 404 || response.status === 405 || response.status === 501) {
        AdkSessionService.localSessionPatchSupported = false;
        return {
          patched: false,
          patchSupported: false,
        };
      }

      AdkSessionService.localSessionPatchSupported = true;
      return {
        patched: false,
        patchSupported: true,
        error: `Session patch failed with status ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      console.error("❌ [ADK SESSION SERVICE] PATCH /sessions exception", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        patched: false,
        patchSupported: AdkSessionService.localSessionPatchSupported ?? true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Convenience functions that use the AdkSessionService
 */
export async function getSessionWithEvents(
  userId: string,
  sessionId: string,
  options?: AdkSessionServiceOptions
): Promise<AdkSessionWithEvents | null> {
  return await AdkSessionService.getSessionWithEvents(userId, sessionId, options);
}

export async function listUserSessions(userId: string): Promise<ListSessionsResponse> {
  return await AdkSessionService.listSessions(userId);
}
