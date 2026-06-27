/** Resume editor updates `?id=` via `history.replaceState` (not Next router), so read both sources. */
export function resolveActiveResumeIdForPatch(searchParams: Pick<URLSearchParams, "get"> | null | undefined): string | null {
  const fromNext = searchParams?.get("id")?.trim();
  if (fromNext) return fromNext;

  if (typeof window !== "undefined") {
    const fromWindow = new URLSearchParams(window.location.search).get("id")?.trim();
    if (fromWindow) return fromWindow;
  }

  return null;
}
