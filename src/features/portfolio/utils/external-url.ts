/** Hostname blocklist is a basic SSRF guard; DNS rebinding is not covered. */
const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "metadata.google.internal", "metadata"]);

const isBlockedIpv4 = (host: string): boolean => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

/** Returns canonical http(s) URL string or null if unsafe/invalid. */
export const normalizeExternalUrl = (raw: string): string | null => {
  let s = raw.trim();
  if (!s) return null;

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!host || BLOCKED_HOSTNAMES.has(host) || host === "::1") {
    return null;
  }
  if (host === "127.0.0.1" || isBlockedIpv4(host)) {
    return null;
  }

  return url.toString();
};

/** Resolves href for portfolio link blocks (http(s), mailto, tel). */
export const resolvePortfolioLinkHref = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^(mailto|tel):/i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return trimmed;
    }
  }

  return normalizeExternalUrl(trimmed);
};

/**
 * Host must look like a real web target: multi-label DNS (has a TLD), IPv4, or IPv6.
 * Avoids treating resolved page titles (e.g. "Google") or bare words as URLs — those normalize
 * to single-label hosts like "google" with no dot.
 */
export const hostnameLooksLikeWebAddress = (hostname: string): boolean => {
  const h = hostname.toLowerCase();
  if (!h) return false;
  if (h.includes(":")) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  return h.includes(".");
};
