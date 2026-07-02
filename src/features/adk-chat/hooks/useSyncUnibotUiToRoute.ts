"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { RESUME_URL_CHANGE } from "@/features/resume/hooks/useResumeUrlState";
import { deriveActiveScope, deriveScopeFromRegistryRow, scopesMatch } from "@/src/features/adk-chat/content-scope";
import { useActiveResumeIdForPatch } from "@/src/features/adk-chat/resolve-active-resume-id";
import { getRegistryRow } from "@/src/features/adk-chat/session-registry";
import type { ChatMessage } from "@/types";

type SearchParamsLike = { get(name: string): string | null } | null | undefined;

function readWindowSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

function subscribeWindowSearch(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", callback);
  window.addEventListener(RESUME_URL_CHANGE, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(RESUME_URL_CHANGE, callback);
  };
}

/**
 * On in-app route changes, align Unibot sub-thread UI with the active feature scope.
 * Does not remount ChatSidebar, refetch ADK session history, or PATCH session state.
 */
export function useSyncUnibotUiToRoute(params: {
  pathname: string;
  searchParams: SearchParamsLike;
  sessionId: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}): void {
  const routeKeyRef = useRef<string | null>(null);
  const windowSearch = useSyncExternalStore(subscribeWindowSearch, readWindowSearch, () => "");
  const activeResumeId = useActiveResumeIdForPatch(params.searchParams);

  useEffect(() => {
    const routeKey = `${params.pathname}${windowSearch}`;
    if (routeKeyRef.current === routeKey) return;
    routeKeyRef.current = routeKey;

    const activeScope = deriveActiveScope({
      pathname: params.pathname,
      searchParams: params.searchParams,
      resumeId: activeResumeId ?? undefined,
      sessionId: params.sessionId,
      sessionKind: "main",
      applicationAsset: {
        assetId: useApplicationAssetStudioStore.getState().assetId,
        role: useApplicationAssetStudioStore.getState().role,
        company: useApplicationAssetStudioStore.getState().company,
      },
      contentGen: {
        assetId: useContentGenStudioStore.getState().assetId,
        topic: useContentGenStudioStore.getState().topic,
      },
    });

    params.setMessages(prev => {
      let matchedTopicId: string | null = null;
      for (const msg of prev) {
        if (!msg.isTopic || !msg.subSessionAdkId) continue;
        const subRow = getRegistryRow(msg.subSessionAdkId);
        if (!subRow) continue;
        const topicScope = deriveScopeFromRegistryRow(subRow);
        if (scopesMatch(activeScope, topicScope) === "full") {
          matchedTopicId = msg.id;
          break;
        }
      }
      if (!matchedTopicId) return prev;
      return prev.map(msg => (msg.isTopic && msg.id === matchedTopicId ? { ...msg, isExpanded: true } : msg));
    });
  }, [params.pathname, params.searchParams, params.sessionId, params.setMessages, windowSearch, activeResumeId]);
}
