"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type ResumeUrlState = {
  resumeId?: string;
  isNewDraft: boolean;
};

export const RESUME_URL_CHANGE = "resume-url-change";

const EMPTY_SNAPSHOT: ResumeUrlState = { resumeId: undefined, isNewDraft: false };

let cachedClientSnapshot: ResumeUrlState = EMPTY_SNAPSHOT;

function getResumeUrlSnapshot(): ResumeUrlState {
  if (typeof window === "undefined") {
    return cachedClientSnapshot;
  }

  const params = new URLSearchParams(window.location.search);
  const resumeId = params.get("id")?.trim() || undefined;
  const isNewDraft = params.get("new") === "scratch";

  if (cachedClientSnapshot.resumeId === resumeId && cachedClientSnapshot.isNewDraft === isNewDraft) {
    return cachedClientSnapshot;
  }

  cachedClientSnapshot = { resumeId, isNewDraft };
  return cachedClientSnapshot;
}

function subscribeResumeUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(RESUME_URL_CHANGE, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(RESUME_URL_CHANGE, callback);
  };
}

export function useResumeUrlState(initial: ResumeUrlState): ResumeUrlState {
  const serverSnapshot = useMemo(
    () => ({ resumeId: initial.resumeId, isNewDraft: initial.isNewDraft }),
    [initial.resumeId, initial.isNewDraft]
  );

  return useSyncExternalStore(subscribeResumeUrl, getResumeUrlSnapshot, () => serverSnapshot);
}

type SetResumeUrlInput = {
  resumeId?: string;
  isNewDraft?: boolean;
};

export function useResumeUrlActions(pathname: string) {
  const setResumeUrl = useCallback(
    (next: SetResumeUrlInput) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);

      if (next.resumeId) {
        params.set("id", next.resumeId);
      } else {
        params.delete("id");
      }

      if (next.isNewDraft) {
        params.set("new", "scratch");
      } else {
        params.delete("new");
      }

      const query = params.toString();
      const nextHref = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(window.history.state, "", nextHref);
      window.dispatchEvent(new Event(RESUME_URL_CHANGE));
    },
    [pathname]
  );

  const openResume = useCallback((resumeId: string) => setResumeUrl({ resumeId, isNewDraft: false }), [setResumeUrl]);

  const openNewDraft = useCallback(() => setResumeUrl({ isNewDraft: true }), [setResumeUrl]);

  const openLanding = useCallback(() => setResumeUrl({}), [setResumeUrl]);

  return { setResumeUrl, openResume, openNewDraft, openLanding };
}
