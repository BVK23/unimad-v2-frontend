/** Frontend static assets under `public/` — must not be prefixed with the API origin. */
const FRONTEND_STATIC_PATH_PREFIXES = ["/images/", "/home/", "/assets/", "/fonts/"] as const;

function isFrontendStaticPath(path: string): boolean {
  return FRONTEND_STATIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

function normalizeFrontendStaticPath(path: string): string {
  if (path.startsWith("/")) return path;
  if (path.startsWith("images/") || path.startsWith("home/") || path.startsWith("assets/") || path.startsWith("fonts/")) {
    return `/${path}`;
  }
  return path;
}

/** Turn stored media paths into a browser-loadable absolute URL. */
export function resolveMediaDisplayUrl(src: string | undefined | null): string {
  if (!src?.trim()) return "";

  let trimmed = src.trim();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ?? "";

  if (backend && trimmed.startsWith(`${backend}${backend}`)) {
    trimmed = trimmed.slice(backend.length);
  }

  // Backend API origin must not serve frontend `public/` assets — strip mistaken prefix.
  if (/^https?:\/\//i.test(trimmed) && backend) {
    try {
      const parsed = new URL(trimmed);
      const backendOrigin = new URL(backend).origin;
      if (parsed.origin === backendOrigin && isFrontendStaticPath(parsed.pathname)) {
        trimmed = parsed.pathname;
      }
    } catch {
      // Keep original value when URL parsing fails.
    }
  }

  if (trimmed.startsWith("data:") || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  trimmed = normalizeFrontendStaticPath(trimmed);

  if (trimmed.startsWith("/") && isFrontendStaticPath(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/") && backend) {
    return `${backend}${trimmed}`;
  }

  return trimmed;
}

/** Next.js `Image` optimization often 400s on localhost/private Django media — load directly. */
export function shouldUseUnoptimizedMedia(src: string): boolean {
  const resolved = resolveMediaDisplayUrl(src);
  if (!resolved || resolved.startsWith("data:")) return true;

  if (resolved.startsWith("/") && isFrontendStaticPath(resolved)) return true;

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");
  if (backend && resolved.startsWith(backend)) return true;

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(resolved);
}
