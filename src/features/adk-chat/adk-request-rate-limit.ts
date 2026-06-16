/** Soft client-side cap to reduce improve / chat spam (per signed-in ADK user id). */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;

const requestTimestampsByUser = new Map<string, number[]>();

export type AdkRequestRateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkAdkRequestRateLimit(userId: string): AdkRequestRateLimitResult {
  const key = userId.trim();
  if (!key) return { allowed: true };

  const now = Date.now();
  const recent = (requestTimestampsByUser.get(key) ?? []).filter(ts => now - ts < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = WINDOW_MS - (now - recent[0]);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  recent.push(now);
  requestTimestampsByUser.set(key, recent);
  return { allowed: true };
}

export const ADK_REQUEST_RATE_LIMIT_MESSAGE = "Too many Unibot requests. Please wait a moment and try again.";
