export type UnibotStreamErrorKind = "rate_limit" | "generic";

export type FormattedUnibotStreamError = {
  kind: UnibotStreamErrorKind;
  message: string;
  retryable: boolean;
};

export const RATE_LIMIT_RETRY_COOLDOWN_SEC = 15;

/** Shown in the sidebar — keep short and non-technical. */
export const RATE_LIMIT_USER_MESSAGE = "Unibot's servers are busy right now. Wait a moment, then try again.";

/** Shown for tool/agent/stream failures — no stack traces or tool names. */
export const GENERIC_USER_MESSAGE = "Something broke while Unibot was working with his team. Please try again.";

function errorText(err: unknown): string {
  if (err instanceof Error) return `${err.message}${err.cause ? ` ${String(err.cause)}` : ""}`;
  return String(err);
}

export function isRateLimitStreamError(err: unknown): boolean {
  const text = errorText(err);
  if (/RESOURCE_EXHAUSTED/i.test(text) || /Resource exhausted/i.test(text) || /Too Many Requests/i.test(text)) {
    return true;
  }
  if (!/\b429\b/.test(text)) {
    return false;
  }
  // ADK model chunks include usageMetadata token counts (e.g. candidatesTokenCount: 429) — not HTTP 429.
  if (/"usageMetadata"\s*:/.test(text) && /"candidatesTokenCount"\s*:\s*429\b/.test(text)) {
    return false;
  }
  return true;
}

const isNormalAdkStreamEvent = (parsed: Record<string, unknown>): boolean =>
  parsed.content != null || typeof parsed.author === "string" || typeof parsed.modelVersion === "string";

/** Do not backoff-retry quota / rate-limit failures — show UI immediately. */
export function isNonRetryableStreamError(err: unknown): boolean {
  return isRateLimitStreamError(err);
}

/**
 * Full error detail for developers (local console, Vercel logs).
 * Never show this string in the chat UI.
 */
export function logUnibotStreamError(err: unknown, context?: Record<string, unknown>): void {
  const detail = errorText(err);
  console.error("[Unibot stream error]", {
    ...context,
    detail,
    err,
  });
}

/**
 * ADK /run_sse may emit `{"error":"..."}` or structured error fields instead of a normal event.
 * Returns an Error to throw from the SSE pipeline, or null when the payload is not an error event.
 */
export function extractStreamErrorFromSsePayload(raw: string): Error | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    // Normal ADK stream events (model chunks, tool calls) are not error envelopes.
    if (isNormalAdkStreamEvent(parsed)) {
      const nestedError = typeof parsed.error === "string" ? parsed.error.trim() : "";
      return nestedError ? new Error(nestedError) : null;
    }

    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return new Error(parsed.error);
    }
    const errorMessage = parsed.errorMessage ?? parsed.error_message;
    if (typeof errorMessage === "string" && errorMessage.trim()) {
      return new Error(errorMessage);
    }
    const errorCode = parsed.errorCode ?? parsed.error_code;
    if (typeof errorCode === "string" && errorCode.trim()) {
      return new Error(errorCode);
    }
  } catch {
    if (isRateLimitStreamError(trimmed)) {
      return new Error(trimmed);
    }
  }

  return null;
}

/** Maps any stream failure to a safe user-facing message; logs the real error separately. */
export function formatUnibotStreamError(err: unknown, logContext?: Record<string, unknown>): FormattedUnibotStreamError {
  logUnibotStreamError(err, logContext);

  if (isRateLimitStreamError(err)) {
    return {
      kind: "rate_limit",
      message: RATE_LIMIT_USER_MESSAGE,
      retryable: true,
    };
  }

  return {
    kind: "generic",
    message: GENERIC_USER_MESSAGE,
    retryable: true,
  };
}
