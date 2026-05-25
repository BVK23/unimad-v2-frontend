export type UnibotStreamErrorKind = "rate_limit" | "generic";

export type FormattedUnibotStreamError = {
  kind: UnibotStreamErrorKind;
  message: string;
  retryable: boolean;
};

const RATE_LIMIT_USER_MESSAGE = "The AI model is temporarily at capacity (too many requests). Please wait a moment and try again.";

const GENERIC_USER_MESSAGE =
  "Unibot could not complete this reply. Please try again. If it keeps happening, refresh the page or contact us at grow@unimad.ai.";

function errorText(err: unknown): string {
  if (err instanceof Error) return `${err.message}${err.cause ? ` ${String(err.cause)}` : ""}`;
  return String(err);
}

export function isRateLimitStreamError(err: unknown): boolean {
  const text = errorText(err);
  return /\b429\b/.test(text) || /RESOURCE_EXHAUSTED/i.test(text) || /Resource exhausted/i.test(text) || /Too Many Requests/i.test(text);
}

/** Do not backoff-retry quota / rate-limit failures — show UI immediately. */
export function isNonRetryableStreamError(err: unknown): boolean {
  return isRateLimitStreamError(err);
}

export function formatUnibotStreamError(err: unknown): FormattedUnibotStreamError {
  if (isRateLimitStreamError(err)) {
    return {
      kind: "rate_limit",
      message: RATE_LIMIT_USER_MESSAGE,
      retryable: true,
    };
  }

  const raw = errorText(err).trim();
  if (raw && raw.length < 200 && !raw.startsWith("API error:")) {
    return { kind: "generic", message: raw, retryable: true };
  }

  return {
    kind: "generic",
    message: GENERIC_USER_MESSAGE,
    retryable: true,
  };
}
