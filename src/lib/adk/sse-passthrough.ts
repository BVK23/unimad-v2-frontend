/**
 * SSE passthrough for /api/run_sse — forwards upstream bytes with minimal buffering.
 * Splits on SSE event boundaries (`\n\n`) so the browser often receives one event per read.
 */
export function createImmediateSsePassthrough(
  upstream: ReadableStream<Uint8Array>,
  logLabel = "local_backend"
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const startedAt = Date.now();
  let upstreamChunkIndex = 0;
  let outboundChunkIndex = 0;
  let pending = "";

  const logOutbound = (bytes: number): void => {
    outboundChunkIndex += 1;
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
      if (outboundChunkIndex <= 30) {
        console.log(`[sse-proxy] ${logLabel} out #${outboundChunkIndex} +${Date.now() - startedAt}ms bytes=${bytes}`);
      }
    }
  };

  const logUpstream = (bytes: number): void => {
    upstreamChunkIndex += 1;
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
      if (upstreamChunkIndex <= 30) {
        console.log(`[sse-proxy] ${logLabel} in #${upstreamChunkIndex} +${Date.now() - startedAt}ms bytes=${bytes}`);
      }
    }
  };

  return new ReadableStream(
    {
      async pull(controller) {
        // Prefer emitting one complete SSE event per pull when buffered.
        const eventEnd = pending.indexOf("\n\n");
        if (eventEnd >= 0) {
          const eventText = pending.slice(0, eventEnd + 2);
          pending = pending.slice(eventEnd + 2);
          const bytes = encoder.encode(eventText);
          logOutbound(bytes.byteLength);
          controller.enqueue(bytes);
          return;
        }

        const { done, value } = await reader.read();
        if (done) {
          if (pending.length > 0) {
            const bytes = encoder.encode(pending);
            pending = "";
            logOutbound(bytes.byteLength);
            controller.enqueue(bytes);
            return;
          }
          if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
            console.log(`[sse-proxy] ${logLabel} end +${Date.now() - startedAt}ms in=${upstreamChunkIndex} out=${outboundChunkIndex}`);
          }
          controller.close();
          return;
        }

        logUpstream(value.byteLength);
        pending += decoder.decode(value, { stream: true });

        const nextEventEnd = pending.indexOf("\n\n");
        if (nextEventEnd >= 0) {
          const eventText = pending.slice(0, nextEventEnd + 2);
          pending = pending.slice(nextEventEnd + 2);
          const bytes = encoder.encode(eventText);
          logOutbound(bytes.byteLength);
          controller.enqueue(bytes);
        }
      },
      cancel(reason) {
        void reader.cancel(reason);
      },
    },
    { highWaterMark: 0 }
  );
}
