import { NextRequest } from "next/server";

function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "app";
}

export interface ProcessedStreamRequest {
  message: string;
  userId: string;
  sessionId: string;
}

export interface AgentEnginePayload {
  class_method: "stream_query";
  input: {
    user_id: string;
    session_id: string;
    message: string;
  };
}

export interface LocalBackendPayload {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: {
    parts: { text: string }[];
    role: "user";
  };
  streaming: boolean;
}

export type BackendPayload = AgentEnginePayload | LocalBackendPayload;

export interface StreamValidationResult {
  isValid: boolean;
  error?: string;
}

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function parseStreamRequest(request: NextRequest): Promise<{
  data: ProcessedStreamRequest | null;
  validation: StreamValidationResult;
}> {
  try {
    const requestBody = (await request.json()) as {
      message?: string;
      userId?: string;
      sessionId?: string;
    };

    const validation = validateStreamRequest(requestBody);
    if (!validation.isValid) {
      return { data: null, validation };
    }

    return {
      data: {
        message: requestBody.message!,
        userId: requestBody.userId!,
        sessionId: requestBody.sessionId!,
      },
      validation: { isValid: true },
    };
  } catch (error) {
    console.error("Error parsing stream request:", error);
    return {
      data: null,
      validation: {
        isValid: false,
        error: "Invalid request format",
      },
    };
  }
}

export function validateStreamRequest(requestBody: { message?: string; userId?: string; sessionId?: string }): StreamValidationResult {
  if (!requestBody.message?.trim()) {
    return { isValid: false, error: "Message is required" };
  }
  if (!requestBody.userId?.trim()) {
    return { isValid: false, error: "User ID is required" };
  }
  if (!requestBody.sessionId?.trim()) {
    return { isValid: false, error: "Session ID is required" };
  }
  return { isValid: true };
}

export function formatAgentEnginePayload(requestData: ProcessedStreamRequest): AgentEnginePayload {
  return {
    class_method: "stream_query",
    input: {
      user_id: requestData.userId,
      session_id: requestData.sessionId,
      message: requestData.message,
    },
  };
}

export function formatLocalBackendPayload(requestData: ProcessedStreamRequest): LocalBackendPayload {
  return {
    appName: getAdkAppName(),
    userId: requestData.userId,
    sessionId: requestData.sessionId,
    newMessage: {
      parts: [{ text: requestData.message }],
      role: "user",
    },
    streaming: true,
  };
}

export function logStreamRequest(
  sessionId: string,
  userId: string,
  message: string,
  deploymentType: "agent_engine" | "local_backend"
): void {
  const truncatedMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;
  console.log(`Stream [${deploymentType}] session=${sessionId} user=${userId} msg=${truncatedMessage}`);
}

export function logStreamStart(url: string, payload: BackendPayload, deploymentType: "agent_engine" | "local_backend"): void {
  console.log(`Forwarding to ${deploymentType}: ${url}`);
}

export function logStreamResponse(
  status: number,
  statusText: string,
  headers: Headers,
  deploymentType: "agent_engine" | "local_backend"
): void {
  console.log(`${deploymentType} response ${status} ${statusText}, content-type=${headers.get("content-type")}`);
}

export function createDebugLog(category: string, message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    if (data !== undefined) {
      console.log(`[${category}] ${message}:`, data);
    } else {
      console.log(`[${category}] ${message}`);
    }
  }
}
