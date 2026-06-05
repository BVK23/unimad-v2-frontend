/** Turn stored media paths into a browser-loadable absolute URL. */
export function resolveMediaDisplayUrl(src: string | undefined | null): string {
  if (!src?.trim()) return "";

  let trimmed = src.trim();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ?? "";

  if (backend && trimmed.startsWith(`${backend}${backend}`)) {
    trimmed = trimmed.slice(backend.length);
  }

  if (trimmed.startsWith("data:") || /^https?:\/\//i.test(trimmed)) {
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

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");
  if (backend && resolved.startsWith(backend)) return true;

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(resolved);
}
