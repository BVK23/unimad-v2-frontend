import { resolveAdkAppName } from "@/src/features/adk-chat/adk-app-names";
import { getEndpointForPath } from "@/src/features/adk-chat/config";
import type { NextApiRequest, NextApiResponse } from "next";
import { CORS_HEADERS, SSE_HEADERS, validateStreamRequest } from "./run-sse-common";

type StreamRequestBody = {
  message?: string;
  userId?: string;
  sessionId?: string;
  adkAppName?: string;
};

/**
 * App Router route at `src/app/api/run_sse/route.ts` pipes `adkResponse.body` to the client.
 * Pages Router `res.write()` was buffered by Next dev until the handler returned (see timing logs).
 */
export async function handleRunSsePagesApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.setHeader(key, value);
    }
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = (typeof req.body === "object" && req.body !== null ? req.body : {}) as StreamRequestBody;
  const validation = validateStreamRequest(body);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.error ?? "Invalid request" });
    return;
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
  let inChunks = 0;

  const adkResponse = await fetch(adkUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify(payload),
  });

  if (!adkResponse.ok || !adkResponse.body) {
    const detail = await adkResponse.text().catch(() => "");
    res.status(adkResponse.status).json({
      error: `ADK error: ${adkResponse.status} ${adkResponse.statusText}`,
      detail: detail.slice(0, 800),
    });
    return;
  }

  for (const [key, value] of Object.entries(SSE_HEADERS)) {
    res.setHeader(key, value);
  }

  // Flush headers immediately so the browser opens the SSE reader before ADK finishes.
  if (typeof (res as NodeJS.WritableStream & { flushHeaders?: () => void }).flushHeaders === "function") {
    (res as NodeJS.WritableStream & { flushHeaders: () => void }).flushHeaders();
  }

  res.socket?.setNoDelay?.(true);

  const reader = adkResponse.body.getReader();
  let outChunks = 0;

  const flushWrittenChunk = (): void => {
    const resWithFlush = res as NextApiResponse & { flush?: () => void };
    resWithFlush.flush?.();
    const socket = res.socket as { uncork?: () => void } | null;
    socket?.uncork?.();
  };

  const writeBytes = async (bytes: Uint8Array): Promise<void> => {
    if (!bytes.byteLength) return;
    outChunks += 1;
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
      if (outChunks <= 30) {
        console.log(`[sse-proxy] pages_api out #${outChunks} +${Date.now() - streamStartedAt}ms bytes=${bytes.byteLength}`);
      }
    }
    await new Promise<void>((resolve, reject) => {
      res.write(bytes, err => {
        if (err) reject(err);
        else resolve();
      });
    });
    flushWrittenChunk();
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
          console.log(`[sse-proxy] pages_api end +${Date.now() - streamStartedAt}ms in=${inChunks} out=${outChunks}`);
        }
        res.end();
        return;
      }

      inChunks += 1;
      if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
        if (inChunks <= 30) {
          console.log(`[sse-proxy] pages_api in #${inChunks} +${Date.now() - streamStartedAt}ms bytes=${value.byteLength}`);
        }
      }

      // Raw passthrough — do not wait for complete SSE events before writing.
      await writeBytes(value);
    }
  } catch (streamError) {
    if (!res.writableEnded) {
      res.end();
    }
    throw streamError;
  }
}
