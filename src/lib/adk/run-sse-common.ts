import { resolveAdkAppName } from "@/src/features/adk-chat/adk-app-names";
import { NextRequest } from "next/server";

export interface ProcessedStreamRequest {
  message: string;
  userId: string;
  sessionId: string;
  adkAppName?: string;
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

/** Outbound SSE headers — discourage proxy/AV buffering and compression. */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
  Pragma: "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
  /** Explicit identity discourages gzip/brotli middleware from buffering the stream. */
  "Content-Encoding": "identity",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control",
  "Access-Control-Expose-Headers": "Content-Type, Cache-Control",
} as const;

/** Upstream fetch to ADK — ask for uncompressed bytes where supported. */
export const SSE_UPSTREAM_FETCH_HEADERS = {
  "Content-Type": "application/json",
  Accept: "text/event-stream",
  "Cache-Control": "no-cache",
  "Accept-Encoding": "identity",
} as const;

export function applySseProxyResponseHeaders(upstream?: Headers): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(SSE_HEADERS)) {
    headers.set(key, value);
  }
  // Never forward upstream length/encoding — they can cause client/proxy buffering.
  void upstream;
  headers.delete("content-length");
  return headers;
}

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
      adkAppName?: string;
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
        adkAppName: requestBody.adkAppName?.trim() || undefined,
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
    appName: resolveAdkAppName(requestData.adkAppName),
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
  if (!isAdkDebugLoggingEnabled()) return;
  const truncatedMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;
  console.log(`Stream [${deploymentType}] session=${sessionId} user=${userId} msg=${truncatedMessage}`);
}

export function logStreamStart(url: string, payload: BackendPayload, deploymentType: "agent_engine" | "local_backend"): void {
  if (!isAdkDebugLoggingEnabled()) return;
  console.log(`Forwarding to ${deploymentType}: ${url}`);
}

export function logStreamResponse(
  status: number,
  statusText: string,
  headers: Headers,
  deploymentType: "agent_engine" | "local_backend"
): void {
  if (!isAdkDebugLoggingEnabled()) return;
  console.log(`${deploymentType} response ${status} ${statusText}, content-type=${headers.get("content-type")}`);
}

/** Opt-in verbose ADK client logs (`ADK_DEBUG=1` or `NEXT_PUBLIC_ADK_DEBUG=1`). */
export function isAdkDebugLoggingEnabled(): boolean {
  return process.env.ADK_DEBUG === "1" || process.env.NEXT_PUBLIC_ADK_DEBUG === "1";
}

export function createDebugLog(category: string, message: string, data?: unknown): void {
  if (!isAdkDebugLoggingEnabled()) {
    return;
  }
  if (data !== undefined) {
    console.log(`[${category}] ${message}:`, data);
  } else {
    console.log(`[${category}] ${message}`);
  }
}
