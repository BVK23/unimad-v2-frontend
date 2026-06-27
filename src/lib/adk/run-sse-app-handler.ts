import { resolveAdkAppName } from "@/src/features/adk-chat/adk-app-names";
import { getEndpointForPath } from "@/src/features/adk-chat/config";
import { CORS_HEADERS, applySseProxyResponseHeaders, SSE_UPSTREAM_FETCH_HEADERS, validateStreamRequest } from "./run-sse-common";

type StreamRequestBody = {
  message?: string;
  userId?: string;
  sessionId?: string;
  adkAppName?: string;
};

async function logUpstreamSseBody(body: ReadableStream<Uint8Array>, streamStartedAt: number): Promise<void> {
  const reader = body.getReader();
  let inChunks = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`[sse-proxy] app_route end +${Date.now() - streamStartedAt}ms in=${inChunks}`);
        return;
      }
      inChunks += 1;
      if (inChunks <= 30) {
        console.log(`[sse-proxy] app_route tee-log #${inChunks} +${Date.now() - streamStartedAt}ms bytes=${value.byteLength}`);
      }
    }
  } catch (error) {
    console.warn("[sse-proxy] app_route tee-log stopped:", error);
  }
}

/**
 * App Router SSE proxy — returns native `adkResponse.body` to the browser (no pull()-wrapper).
 * Next dev may still buffer; use NEXT_PUBLIC_ADK_SSE_DIRECT in .env.local to bypass Next in dev.
 */
export async function proxyRunSseFromRequest(req: Request): Promise<Response> {
  let body: StreamRequestBody;
  try {
    body = (await req.json()) as StreamRequestBody;
  } catch {
    return Response.json({ error: "Invalid request format" }, { status: 400 });
  }

  const validation = validateStreamRequest(body);
  if (!validation.isValid) {
    return Response.json({ error: validation.error ?? "Invalid request" }, { status: 400 });
  }

  const payload = {
    appName: resolveAdkAppName(body.adkAppName?.trim() || undefined),
    userId: body.userId!,
    sessionId: body.sessionId!,
    newMessage: {
      parts: [{ text: body.message! }],
      role: "user" as const,
    },
    streaming: true,
  };

  const adkUrl = `${getEndpointForPath("/run_sse")}`;
  const streamStartedAt = Date.now();

  const adkResponse = await fetch(adkUrl, {
    method: "POST",
    headers: SSE_UPSTREAM_FETCH_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!adkResponse.ok || !adkResponse.body) {
    const detail = await adkResponse.text().catch(() => "");
    return Response.json(
      {
        error: `ADK error: ${adkResponse.status} ${adkResponse.statusText}`,
        detail: detail.slice(0, 800),
      },
      { status: adkResponse.status }
    );
  }

  const headers = applySseProxyResponseHeaders(adkResponse.headers);

  const shouldLog = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1";

  if (shouldLog) {
    const [clientBody, logBody] = adkResponse.body.tee();
    void logUpstreamSseBody(logBody, streamStartedAt);
    return new Response(clientBody, { status: 200, headers });
  }

  return new Response(adkResponse.body, { status: 200, headers });
}

export function runSseOptionsResponse(): Response {
  return new Response(null, {
    status: 200,
    headers: new Headers(CORS_HEADERS),
  });
}
