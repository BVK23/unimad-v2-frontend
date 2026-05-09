import { getEndpointForPath, getAuthHeaders, shouldUseAgentEngine } from "./config";

function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "app";
}

export interface SessionCreationResult {
  success: boolean;
  sessionId?: string;
  created?: boolean;
  error?: string;
  deploymentType?: string;
}

export abstract class SessionService {
  abstract createSession(userId: string): Promise<SessionCreationResult>;
}

export class AgentEngineSessionService extends SessionService {
  async createSession(userId: string): Promise<SessionCreationResult> {
    const sessionEndpoint = getEndpointForPath("", "query");

    const createSessionPayload = {
      class_method: "create_session",
      input: {
        user_id: userId,
      },
    };

    try {
      const authHeaders = await getAuthHeaders();
      const createSessionResponse = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createSessionPayload),
      });

      if (createSessionResponse.ok) {
        const sessionData = (await createSessionResponse.json()) as {
          output?: { id?: string };
        };
        const actualSessionId = sessionData.output?.id;
        if (actualSessionId) {
          return {
            success: true,
            sessionId: actualSessionId,
            created: true,
            deploymentType: "agent_engine",
          };
        }
      }

      return {
        success: false,
        sessionId: "",
        created: false,
        error: "Agent Engine session creation failed",
        deploymentType: "agent_engine",
      };
    } catch (sessionError) {
      return {
        success: false,
        sessionId: "",
        created: false,
        error: `Agent Engine session creation error: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`,
        deploymentType: "agent_engine",
      };
    }
  }
}

export class LocalBackendSessionService extends SessionService {
  async createSession(userId: string): Promise<SessionCreationResult> {
    const appName = getAdkAppName();
    const sessionEndpoint = getEndpointForPath(`/apps/${appName}/users/${userId}/sessions`);

    try {
      const sessionAuthHeaders = await getAuthHeaders();
      const sessionResponse = await fetch(sessionEndpoint, {
        method: "POST",
        headers: {
          ...sessionAuthHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        return {
          success: false,
          error: `Local backend session creation failed: ${sessionResponse.status} ${errorText}`,
          deploymentType: "local_backend",
        };
      }

      const sessionData = (await sessionResponse.json()) as { id?: string };
      const sessionId = sessionData.id;

      if (!sessionId) {
        return {
          success: false,
          error: "Local backend did not return a session ID",
          deploymentType: "local_backend",
        };
      }

      return {
        success: true,
        sessionId,
        created: true,
        deploymentType: "local_backend",
      };
    } catch (sessionError) {
      return {
        success: false,
        error: `Local backend session creation error: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}`,
        deploymentType: "local_backend",
      };
    }
  }
}

export function getSessionService(): SessionService {
  if (shouldUseAgentEngine()) {
    return new AgentEngineSessionService();
  }
  return new LocalBackendSessionService();
}

export async function createSessionWithService(userId: string): Promise<SessionCreationResult> {
  const service = getSessionService();
  return service.createSession(userId);
}
