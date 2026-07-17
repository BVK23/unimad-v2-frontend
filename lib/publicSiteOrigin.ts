/**
 * Host label for publish URL prefixes (e.g. `localhost:3000`, `unimad.ai`).
 * Prefer the live browser origin; fall back to public env on the server.
 */
export function getPublicSiteHost(): string {
  if (typeof window !== "undefined" && window.location?.host) {
    return window.location.host;
  }
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (fromEnv) {
    try {
      return new URL(fromEnv).host;
    } catch {
      return fromEnv.replace(/^https?:\/\//, "").split("/")[0] || "localhost:3000";
    }
  }
  return "localhost:3000";
}

export function getPublicSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (fromEnv) return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  return "http://localhost:3000";
}
