const GENERIC_SERVER_ERROR = "Something went wrong on our end. Please try again in a moment.";
const GENERIC_CLIENT_ERROR = "Request failed. Please try again.";

/** Raw agent, Django debug, or HTML responses that must not be shown in the UI. */
export function looksLikeTechnicalErrorMessage(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("<!doctype") ||
    lower.startsWith("<html") ||
    lower.includes("<title>") ||
    lower.includes("attributeerror at /api") ||
    lower.includes("malformed function call") ||
    lower.includes("default_api.") ||
    lower.includes("traceback (most recent call last)") ||
    lower.includes("an error occurred in the server components render") ||
    lower.includes("digest property is included on this error") ||
    lower.includes("value too long for type character varying") ||
    lower.includes("character varying(") ||
    lower.includes("django.db.utils") ||
    lower.includes("integrityerror") ||
    lower.includes("dataerror") ||
    lower.includes("operationalerror") ||
    /^print\(default_api\./i.test(trimmed) ||
    (/^error:\s/i.test(trimmed) && lower.includes("varying"))
  );
}

/** Avoid surfacing Django HTML debug pages or other non-JSON error bodies in the UI. */
export function messageFromFailedResponse(status: number, bodyText: string, jsonError?: string): string {
  const candidate = (jsonError ?? bodyText).trim();

  if (looksLikeTechnicalErrorMessage(candidate)) {
    return status >= 500 ? GENERIC_SERVER_ERROR : GENERIC_CLIENT_ERROR;
  }

  return candidate.length > 400 ? `${candidate.slice(0, 400)}…` : candidate;
}

/** Sanitize arbitrary error strings (client throws, agent output, server-action messages). */
export function sanitizeUserFacingError(message: string, fallback = "Something went wrong. Please try again."): string {
  const trimmed = message.trim();
  if (!trimmed || looksLikeTechnicalErrorMessage(trimmed)) {
    return fallback;
  }
  return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed;
}

/** Dev/team console detail — masks raw internals so casual console peekers get less signal. */
export function logSanitizedError(scope: string, error: unknown, extra?: Record<string, unknown>): void {
  const raw = error instanceof Error ? error.message : String(error);
  const masked = raw.length > 120 ? `${raw.slice(0, 40)}…[${raw.length}c]…${raw.slice(-20)}` : raw;
  console.error(`[${scope}]`, { masked, ...extra, error });
}
