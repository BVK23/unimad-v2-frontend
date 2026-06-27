import { resolveAdkAppName } from "@/src/features/adk-chat/adk-app-names";
import type { StreamingAPIPayload } from "@/src/features/adk-chat/streaming/types";

/** When the app is on localhost, prefer localhost for ADK (not 127.0.0.1) — avoids Chrome private-network quirks. */
function normalizeDirectAdkBase(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return trimmed.replace("127.0.0.1", "localhost");
  }
  return trimmed;
}

/** Default: Next.js proxy. Dev override: browser → ADK directly (bypasses Next dev response buffering). */
export function resolveAdkChatStreamUrl(): string {
  const direct = process.env.NEXT_PUBLIC_ADK_SSE_DIRECT?.trim();
  if (process.env.NODE_ENV === "development" && direct) {
    return `${normalizeDirectAdkBase(direct)}/run_sse`;
  }
  return "/api/run_sse";
}

export function isDirectAdkSseInDev(): boolean {
  return Boolean(process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ADK_SSE_DIRECT?.trim());
}

export function buildRunSseFetchInit(payload: StreamingAPIPayload): RequestInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    "Cache-Control": "no-cache, no-store",
    Pragma: "no-cache",
    "Accept-Encoding": "identity",
  };

  if (isDirectAdkSseInDev()) {
    return {
      method: "POST",
      headers,
      body: JSON.stringify({
        appName: resolveAdkAppName(payload.adkAppName),
        userId: payload.userId,
        sessionId: payload.sessionId,
        streaming: true,
        newMessage: {
          role: "user",
          parts: [{ text: payload.message }],
        },
      }),
      cache: "no-store",
    };
  }

  return {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  };
}
