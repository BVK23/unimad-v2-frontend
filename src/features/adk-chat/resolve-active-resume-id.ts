import { useSyncExternalStore } from "react";

const RESUME_URL_CHANGE = "resume-url-change";

function readResumeIdFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("id")?.trim() || null;
}

function subscribeResumeUrl(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener(RESUME_URL_CHANGE, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(RESUME_URL_CHANGE, callback);
  };
}

/** Resume editor updates `?id=` via `history.replaceState` (not Next router), so read both sources. */
export function resolveActiveResumeIdForPatch(searchParams: Pick<URLSearchParams, "get"> | null | undefined): string | null {
  const fromNext = searchParams?.get("id")?.trim();
  if (fromNext) return fromNext;
  return readResumeIdFromWindow();
}

/** Reactive resume id for PATCH — re-renders when the editor updates `?id=` via `replaceState`. */
export function useActiveResumeIdForPatch(searchParams: Pick<URLSearchParams, "get"> | null | undefined): string | null {
  const fromWindow = useSyncExternalStore(subscribeResumeUrl, readResumeIdFromWindow, () => null);
  return searchParams?.get("id")?.trim() || fromWindow || null;
}
