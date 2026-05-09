/**
 * Server-only ADK / Agent Engine endpoint configuration.
 * Separate from Django `NEXT_PUBLIC_BACKEND_URL` used for user APIs.
 *
 * Local ADK Python: set `ADK_BACKEND_URL` (preferred; avoids clashing with Django
 *   `BACKEND_URL`) to the agent server, e.g. http://127.0.0.1:8001 if Django uses 8000.
 *   Default when unset is http://127.0.0.1:8001 (Django often uses 8000).
 *   Optional `ADK_APP_NAME` (default "app").
 * Agent Engine: set `AGENT_ENGINE_ENDPOINT` and `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`.
 */

export interface EndpointConfig {
  backendUrl: string;
  agentEngineUrl?: string;
  environment: "local" | "cloud";
  deploymentType: "local" | "agent_engine" | "cloud_run";
}

function detectEnvironment(): EndpointConfig["environment"] {
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE || process.env.FUNCTION_NAME) {
    return "cloud";
  }
  return "local";
}

function detectDeploymentType(): EndpointConfig["deploymentType"] {
  if (process.env.AGENT_ENGINE_ENDPOINT) {
    return "agent_engine";
  }
  if (process.env.K_SERVICE || process.env.CLOUD_RUN_SERVICE) {
    return "cloud_run";
  }
  return "local";
}

function getBackendUrl(): string {
  const deploymentType = detectDeploymentType();
  switch (deploymentType) {
    case "agent_engine":
      if (process.env.AGENT_ENGINE_ENDPOINT) {
        return process.env.AGENT_ENGINE_ENDPOINT;
      }
      throw new Error("AGENT_ENGINE_ENDPOINT environment variable is required for Agent Engine deployment");
    case "cloud_run":
      if (process.env.CLOUD_RUN_SERVICE_URL) {
        return process.env.CLOUD_RUN_SERVICE_URL;
      }
      break;
    default:
      return process.env.ADK_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8001";
  }
  return process.env.ADK_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:8001";
}

function getAgentEngineUrl(): string | undefined {
  return process.env.AGENT_ENGINE_ENDPOINT || undefined;
}

export function createEndpointConfig(): EndpointConfig {
  return {
    backendUrl: getBackendUrl(),
    agentEngineUrl: getAgentEngineUrl(),
    environment: detectEnvironment(),
    deploymentType: detectDeploymentType(),
  };
}

export const endpointConfig = createEndpointConfig();

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (endpointConfig.deploymentType === "agent_engine") {
    const serviceAccountKeyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

    if (!serviceAccountKeyBase64) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is required for Agent Engine deployment");
    }

    const serviceAccountKeyJson = Buffer.from(serviceAccountKeyBase64, "base64").toString("utf-8");
    const credentials = JSON.parse(serviceAccountKeyJson);

    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (accessToken.token) {
      headers["Authorization"] = `Bearer ${accessToken.token}`;
    }
  }

  return headers;
}

export function shouldUseAgentEngine(): boolean {
  return endpointConfig.deploymentType === "agent_engine" && Boolean(endpointConfig.agentEngineUrl);
}

export type AgentEngineEndpointType = "query" | "streamQuery" | "sessions";

function getAgentEngineSessionsUrl(): string | undefined {
  if (!endpointConfig.agentEngineUrl) return undefined;

  const urlParts = endpointConfig.agentEngineUrl.match(
    /^(https:\/\/[^/]+)\/v1\/(projects\/[^/]+\/locations\/[^/]+\/reasoningEngines\/[^/]+)/
  );

  if (urlParts) {
    const [, baseUrl, projectPath] = urlParts;
    return `${baseUrl}/v1beta1/${projectPath}`;
  }

  return undefined;
}

export function getEndpointForPath(path: string, endpointType: AgentEngineEndpointType = "streamQuery"): string {
  if (shouldUseAgentEngine()) {
    if (endpointType === "streamQuery") {
      return `${endpointConfig.agentEngineUrl}:streamQuery`;
    }
    if (endpointType === "query") {
      return `${endpointConfig.agentEngineUrl}:query`;
    }
    if (endpointType === "sessions") {
      const sessionsUrl = getAgentEngineSessionsUrl();
      if (!sessionsUrl) {
        throw new Error("Could not construct sessions API URL from AGENT_ENGINE_ENDPOINT");
      }
      return `${sessionsUrl}/sessions${path}`;
    }
  }

  return `${endpointConfig.backendUrl}${path}`;
}

export function getAgentEngineStreamEndpoint(): string {
  return getEndpointForPath("", "streamQuery");
}
