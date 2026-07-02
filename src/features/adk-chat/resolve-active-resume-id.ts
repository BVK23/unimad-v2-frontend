import { useSyncExternalStore } from "react";
import { RESUME_URL_CHANGE } from "@/features/resume/hooks/useResumeUrlState";

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

/**
 * Resume editor updates `?id=` via `history.replaceState` (not Next router).
 * On the client, the live URL bar is the source of truth — including when `id` is cleared on landing.
 */
export function resolveActiveResumeIdForPatch(searchParams: Pick<URLSearchParams, "get"> | null | undefined): string | null {
  if (typeof window !== "undefined") {
    return readResumeIdFromWindow();
  }
  return searchParams?.get("id")?.trim() || null;
}

/** Reactive resume id for PATCH — re-renders when the editor updates `?id=` via `replaceState`. */
export function useActiveResumeIdForPatch(searchParams: Pick<URLSearchParams, "get"> | null | undefined): string | null {
  const fromWindow = useSyncExternalStore(subscribeResumeUrl, readResumeIdFromWindow, () => null);
  if (typeof window !== "undefined") {
    return fromWindow;
  }
  return searchParams?.get("id")?.trim() || null;
}
