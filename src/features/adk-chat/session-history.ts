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

/**
 * Gets the ADK app name from environment or defaults
 */
function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "app";
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
  static async getSession(userId: string, sessionId: string): Promise<AdkSession | null> {
    const appName = getAdkAppName();

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
      // Local Backend: GET with path
      const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);

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

      console.log("🔗 [ADK SESSION SERVICE] Agent Engine listSessions request:", {
        endpoint,
        method: "GET",
      });

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

      console.log("🔗 [ADK SESSION SERVICE] Local Backend listSessions request:", {
        endpoint,
        method: "GET",
        userId,
        appName,
      });

      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            ...authHeaders,
          },
        });

        console.log("📡 [ADK SESSION SERVICE] Local Backend response:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
        });

        if (!response.ok) {
          throw new Error(`Failed to list sessions: ${response.statusText}`);
        }

        const sessions: AdkSession[] = await response.json();

        console.log("✅ [ADK SESSION SERVICE] Local Backend success:", {
          sessionsCount: sessions.length,
          sessionIds: sessions.map(s => s.id || "no-id"),
        });

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
   */
  static async deleteSession(userId: string, sessionId: string): Promise<void> {
    const appName = getAdkAppName();

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

    const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);
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
      console.error("❌ [ADK SESSION SERVICE] Local Backend deleteSession error:", error);
      throw error;
    }
  }

  /**
   * Lists all events for a specific session
   */
  static async listEvents(userId: string, sessionId: string): Promise<ListEventsResponse> {
    const appName = getAdkAppName();

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
  static async getSessionWithEvents(userId: string, sessionId: string): Promise<AdkSessionWithEvents | null> {
    try {
      if (shouldUseAgentEngine()) {
        // For Agent Engine, get events directly from the /events endpoint
        const eventsResponse = await AdkSessionService.listEvents(userId, sessionId);
        const events = eventsResponse?.events || [];

        // Create a minimal session object with the events
        const session: AdkSessionWithEvents = {
          id: sessionId,
          user_id: userId,
          app_name: process.env.ADK_APP_NAME || "app",
          state: null,
          last_update_time: new Date().toISOString(),
          events: events,
        };

        return session;
      } else {
        // Local backend - fetch session only (backend includes events in session detail)
        const session = await AdkSessionService.getSession(userId, sessionId);

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
   * Tries to patch local ADK session state. Agent Engine uses a different API path
   * and currently does not use this helper.
   */
  static async patchSessionState(
    userId: string,
    sessionId: string,
    stateDelta: Record<string, unknown>
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

    const appName = getAdkAppName();
    const endpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions/${sessionId}`);

    try {
      const authHeaders = await getAuthHeaders();
      console.log("📤 [ADK SESSION SERVICE] PATCH /sessions stateDelta", {
        endpoint,
        userId,
        sessionId,
        keys: Object.keys(stateDelta),
        activeContext: stateDelta.active_context,
        currentResume: stateDelta.current_resume,
        resumeDataCount:
          stateDelta.resume_data && typeof stateDelta.resume_data === "object"
            ? Object.keys(stateDelta.resume_data as Record<string, unknown>).length
            : 0,
      });
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          ...authHeaders,
        },
        body: JSON.stringify({
          stateDelta,
        }),
      });

      if (response.ok) {
        AdkSessionService.localSessionPatchSupported = true;
        console.log("✅ [ADK SESSION SERVICE] PATCH /sessions success", {
          sessionId,
          status: response.status,
        });
        return {
          patched: true,
          patchSupported: true,
        };
      }

      // Older ADK versions do not support this method.
      if (response.status === 404 || response.status === 405 || response.status === 501) {
        AdkSessionService.localSessionPatchSupported = false;
        console.warn("⚠️ [ADK SESSION SERVICE] PATCH /sessions unsupported", {
          sessionId,
          status: response.status,
        });
        return {
          patched: false,
          patchSupported: false,
        };
      }

      AdkSessionService.localSessionPatchSupported = true;
      console.warn("⚠️ [ADK SESSION SERVICE] PATCH /sessions failed", {
        sessionId,
        status: response.status,
        statusText: response.statusText,
      });
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
export async function getSessionWithEvents(userId: string, sessionId: string): Promise<AdkSessionWithEvents | null> {
  return await AdkSessionService.getSessionWithEvents(userId, sessionId);
}

export async function listUserSessions(userId: string): Promise<ListSessionsResponse> {
  return await AdkSessionService.listSessions(userId);
}
