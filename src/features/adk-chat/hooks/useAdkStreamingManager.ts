"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAdkResumeDataMap, buildAdkResumeStateDelta, mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { pullSessionStateAction, syncSessionStateAction } from "../actions";
import { computeAdkReviewFromDiff } from "../adkResumeHighlightDiff";
import { useAdkResumeReviewStore } from "../stores/useAdkResumeReviewStore";
import type { AgentMessage, ProcessedEvent } from "../types";
import { useAdkStreaming } from "./useAdkStreaming";
import { useBackendHealth } from "./useBackendHealth";

export interface UseAdkStreamingManagerParams {
  userId: string;
  sessionId: string;
  onMessageUpdate: (message: AgentMessage) => void;
  onEventUpdate: (messageId: string, event: ProcessedEvent) => void;
  onWebsiteCountUpdate: (count: number) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export interface UseAdkStreamingManagerReturn {
  isLoading: boolean;
  currentAgent: string;
  /** User-facing line derived from streaming agent/tool events (sidebar UX). */
  streamActivityLabel: string | null;
  submitMessage: (message: string, options?: { aiMessageId?: string }) => Promise<void>;
}

export function useAdkStreamingManager({
  userId,
  sessionId,
  onMessageUpdate,
  onEventUpdate,
  onWebsiteCountUpdate,
  onLoadingChange,
}: UseAdkStreamingManagerParams): UseAdkStreamingManagerReturn {
  const { retryWithBackoff } = useBackendHealth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const lastSyncedFingerprintRef = useRef<string | null>(null);
  const lastStoreFingerprintRef = useRef<string | null>(null);
  const suppressStoreSyncRef = useRef(false);
  const sessionPullDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Captures resume snapshot before ADK session GET applies mutating tool results (avoids racing after_stream). */
  const pendingPrePullBaselineRef = useRef<ResumeData | null>(null);
  /** Captures assistant bubble id for the in-flight stream (review cards attach to this message). */
  const pendingReviewAssistantIdRef = useRef<string | null>(null);
  const [streamActivityLabel, setStreamActivityLabel] = useState<string | null>(null);
  const resumeId = useMemo(() => {
    const raw = searchParams.get("id");
    return raw && raw.trim().length > 0 ? raw.trim() : null;
  }, [searchParams]);

  const { isLoading, currentAgent, startStream } = useAdkStreaming(retryWithBackoff);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (!isLoading) {
      setStreamActivityLabel(null);
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (sessionPullDebounceRef.current) {
        clearTimeout(sessionPullDebounceRef.current);
      }
    };
  }, []);

  const getStateDeltaForCurrentRoute = useCallback((): {
    stateDelta: Record<string, unknown>;
    source: "zustand" | "react_query" | "list_zustand" | "clear_context";
  } => {
    const isResumeRoute = pathname.startsWith("/uniboard/resume");
    const allStoreResumes = useResumeStore.getState().resumeData;

    if (isResumeRoute && !resumeId) {
      return {
        stateDelta: {
          active_context: "resume",
          current_resume: null,
          resume_data: buildAdkResumeDataMap(allStoreResumes),
        },
        source: "list_zustand",
      };
    }

    if (isResumeRoute && resumeId) {
      const storeResume = useResumeStore.getState().getResumeData(resumeId);
      const queryResume = queryClient.getQueryData<ResumeData>(resumeByIdQueryKey(resumeId));
      const sourceResume = storeResume ?? queryResume;

      if (sourceResume) {
        const mergedResumes = {
          ...allStoreResumes,
          [resumeId]: sourceResume,
        };
        const base = buildAdkResumeStateDelta(sourceResume);
        return {
          stateDelta: {
            ...base,
            resume_data: buildAdkResumeDataMap(mergedResumes),
          },
          source: storeResume ? "zustand" : "react_query",
        };
      }
    }

    return {
      stateDelta: {
        active_context: "none",
        current_resume: null,
        resume_data: {},
      },
      source: "clear_context",
    };
  }, [pathname, resumeId, queryClient]);

  const syncCurrentSessionState = useCallback(
    async (reason: "route_change" | "before_send" | "store_change"): Promise<void> => {
      if (!userId || !sessionId) {
        return;
      }

      const { stateDelta, source } = getStateDeltaForCurrentRoute();
      const fingerprint = JSON.stringify(stateDelta);
      if ((reason === "route_change" || reason === "store_change") && lastSyncedFingerprintRef.current === fingerprint) {
        console.log("ℹ️ [ADK STATE SYNC] Skipping duplicate route PATCH", {
          reason,
          sessionId,
          resumeId,
          source,
        });
        return;
      }

      console.log("📤 [ADK STATE SYNC] PATCH session state", {
        reason,
        sessionId,
        resumeId,
        source,
        keys: Object.keys(stateDelta),
        activeContext: stateDelta.active_context,
        patchedResumeId: stateDelta.current_resume,
      });

      const syncResult = await syncSessionStateAction(userId, sessionId, stateDelta);
      if (!syncResult.success) {
        console.warn("⚠️ [ADK STREAMING] Session PATCH sync failed", {
          sessionId,
          reason,
          error: syncResult.error,
        });
        return;
      }

      lastSyncedFingerprintRef.current = fingerprint;
      console.log("✅ [ADK STATE SYNC] PATCH success", {
        reason,
        sessionId,
        resumeId,
        source,
      });
    },
    [userId, sessionId, resumeId, getStateDeltaForCurrentRoute]
  );

  useEffect(() => {
    void syncCurrentSessionState("route_change");
  }, [syncCurrentSessionState]);

  useEffect(() => {
    const unsubscribe = useResumeStore.subscribe(state => {
      if (suppressStoreSyncRef.current) {
        return;
      }
      const nextFingerprint = JSON.stringify(state.resumeData);
      if (lastStoreFingerprintRef.current === nextFingerprint) {
        return;
      }
      lastStoreFingerprintRef.current = nextFingerprint;
      void syncCurrentSessionState("store_change");
    });
    return () => unsubscribe();
  }, [syncCurrentSessionState]);

  const syncResumeStoreFromSessionState = useCallback(
    async (reason: "after_stream" | "after_tool_response"): Promise<void> => {
      if (!userId || !sessionId) {
        return;
      }

      const toolDiffBaseline = reason === "after_tool_response" ? pendingPrePullBaselineRef.current : null;

      try {
        const pullResult = await pullSessionStateAction(userId, sessionId);
        if (!pullResult.success || !pullResult.state) {
          if (!pullResult.success) {
            console.warn("⚠️ [ADK STATE SYNC] Session GET sync failed", {
              sessionId,
              reason,
              error: pullResult.error,
            });
          }
          return;
        }

        const nextResumes = mapAdkResumeDataMapToFrontend(pullResult.state.resume_data);
        const store = useResumeStore.getState();
        const currentResumeIdRaw = pullResult.state.current_resume;
        const currentResumeId =
          typeof currentResumeIdRaw === "string" && currentResumeIdRaw.trim().length > 0 ? currentResumeIdRaw.trim() : null;
        const sourceResume = currentResumeId ? nextResumes[currentResumeId] : undefined;
        const currentStoreFingerprint = JSON.stringify(store.resumeData);
        const nextStoreFingerprint = JSON.stringify(nextResumes);

        if (currentStoreFingerprint === nextStoreFingerprint) {
          return;
        }

        if (reason === "after_tool_response" && toolDiffBaseline && currentResumeId && sourceResume) {
          const { highlights, bannerTitle } = computeAdkReviewFromDiff(toolDiffBaseline, sourceResume);
          if (Object.keys(highlights).length > 0) {
            useAdkResumeReviewStore.getState().beginReview({
              resumeId: currentResumeId,
              baselineResume: toolDiffBaseline,
              highlights,
              bannerTitle,
              assistantMessageId: pendingReviewAssistantIdRef.current,
            });
          }
        }

        suppressStoreSyncRef.current = true;
        try {
          useResumeStore.setState({ resumeData: nextResumes });
          if (currentResumeId && sourceResume) {
            queryClient.setQueryData(resumeByIdQueryKey(currentResumeId), sourceResume);
          }
          console.log("✅ [ADK STATE SYNC] Session GET applied to store", {
            reason,
            sessionId,
            currentResumeId,
            resumeCount: Object.keys(nextResumes).length,
          });
        } finally {
          suppressStoreSyncRef.current = false;
          lastStoreFingerprintRef.current = nextStoreFingerprint;
        }
      } finally {
        if (reason === "after_tool_response") {
          pendingPrePullBaselineRef.current = null;
          pendingReviewAssistantIdRef.current = null;
        }
      }
    },
    [userId, sessionId, queryClient]
  );

  const scheduleResumePullAfterMutatingTool = useCallback(() => {
    if (sessionPullDebounceRef.current) {
      clearTimeout(sessionPullDebounceRef.current);
    }
    sessionPullDebounceRef.current = setTimeout(() => {
      sessionPullDebounceRef.current = null;
      void syncResumeStoreFromSessionState("after_tool_response");
    }, 220);
  }, [syncResumeStoreFromSessionState]);

  const streamExtras = useMemo(
    () => ({
      onMutatingToolResponse: (_toolName: string, aiMessageId: string) => {
        pendingReviewAssistantIdRef.current = aiMessageId;
        if (resumeId) {
          const cur = useResumeStore.getState().getResumeData(resumeId);
          if (cur && !pendingPrePullBaselineRef.current) {
            pendingPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as ResumeData;
          }
        }
        scheduleResumePullAfterMutatingTool();
      },
      onStreamActivityHint: ({ label }: { label: string }) => {
        setStreamActivityLabel(label);
      },
    }),
    [scheduleResumePullAfterMutatingTool, resumeId]
  );

  const submitMessage = useCallback(
    async (message: string, options?: { aiMessageId?: string }): Promise<void> => {
      if (!message.trim() || !userId || !sessionId) {
        throw new Error("Message, userId, and sessionId are required");
      }
      await syncCurrentSessionState("before_send");
      pendingReviewAssistantIdRef.current = options?.aiMessageId ?? null;

      await startStream(
        {
          message: message.trim(),
          userId,
          sessionId,
          aiMessageId: options?.aiMessageId,
        },
        onMessageUpdate,
        onEventUpdate,
        onWebsiteCountUpdate,
        streamExtras
      );
      await syncResumeStoreFromSessionState("after_stream");
    },
    [
      userId,
      sessionId,
      startStream,
      onMessageUpdate,
      onEventUpdate,
      onWebsiteCountUpdate,
      syncCurrentSessionState,
      syncResumeStoreFromSessionState,
      streamExtras,
    ]
  );

  return {
    isLoading,
    currentAgent,
    streamActivityLabel,
    submitMessage,
  };
}
