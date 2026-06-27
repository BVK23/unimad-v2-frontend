import { getEndpointForPath, getAuthHeaders } from "@/src/features/adk-chat/config";
import { createInternalServerError, createBackendConnectionError, createStreamingError } from "./error-utils";
import { ProcessedStreamRequest, formatLocalBackendPayload, logStreamStart, logStreamResponse, SSE_HEADERS } from "./run-sse-common";
import { createImmediateSsePassthrough } from "./sse-passthrough";

function validateStreamingResponse(response: Response): {
  isValid: boolean;
  error?: string;
} {
  if (!response.ok) {
    return {
      isValid: false,
      error: `Backend error: ${response.status} ${response.statusText}`,
    };
  }
  if (!response.body) {
    return {
      isValid: false,
      error: "No response body available for streaming",
    };
  }
  return { isValid: true };
}

export async function handleLocalBackendStreamRequest(requestData: ProcessedStreamRequest): Promise<Response> {
  const streamStartedAt = Date.now();
  try {
    const localBackendPayload = formatLocalBackendPayload(requestData);
    const localBackendUrl = `${getEndpointForPath("/run_sse")}`;
    logStreamStart(localBackendUrl, localBackendPayload, "local_backend");

    const authHeaders = await getAuthHeaders();
    const authReadyAt = Date.now();

    const response = await fetch(localBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(localBackendPayload),
    });
    const responseHeadersAt = Date.now();

    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1") {
      console.log(
        `[draft-gen-timing] run_sse_proxy:local | auth_ready +${authReadyAt - streamStartedAt}ms | adk_ttfb +${responseHeadersAt - streamStartedAt}ms | status ${response.status}`
      );
    }

    const validation = validateStreamingResponse(response);
    if (!validation.isValid) {
      let errorDetails = validation.error || "Unknown error";
      try {
        const errorText = await response.text();
        if (errorText) {
          errorDetails = `${validation.error}. ${errorText}`;
        }
      } catch {
        /* ignore */
      }

      return createBackendConnectionError("local_backend", response.status, response.statusText, errorDetails);
    }

    logStreamResponse(response.status, response.statusText, response.headers, "local_backend");

    if (!response.body) {
      return createBackendConnectionError("local_backend", 500, "No body", "No response body available for streaming");
    }

    const passthrough = createImmediateSsePassthrough(response.body, "local_backend");

    return new Response(passthrough, {
      status: 200,
      headers: SSE_HEADERS,
    });
  } catch (error) {
    console.error("Local backend handler error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createBackendConnectionError("local_backend", 500, "Connection failed", "Failed to connect to local backend");
    }

    return createStreamingError("local_backend", error, "Failed to process local backend streaming request");
  }
}

export function createLocalBackendError(error: string, details?: unknown): Response {
  return createInternalServerError(`Local Backend Error: ${error}`, details instanceof Error ? details : new Error(String(details)));
}
