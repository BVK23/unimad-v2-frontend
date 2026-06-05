"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAdkApplicationAssetStateDelta } from "@/features/application-assets/api/adk-mappers";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import { STUDIO_TOPIC_TO_API_TYPE, type ApplicationAssetStudioTopic } from "@/features/application-assets/types";
import { buildAdkContentGenStateDelta } from "@/features/content-lab/api/adk-mappers";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta, mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildAdkLinkedInStateDelta } from "@/src/features/linkedin/api/adk-mappers";
import { linkedinAnalysisQueryKey, useLinkedInAnalysis } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import type { LinkedInAnalysisSnapshot } from "@/src/features/linkedin/types";
import { buildAdkResumeDataMap, buildAdkResumeStateDelta, mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { PortfolioData, ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { pullSessionStateAction, syncSessionStateAction } from "../actions";
import { computeAdkPortfolioReviewFromDiff } from "../adkPortfolioHighlightDiff";
import { computeAdkReviewFromDiff } from "../adkResumeHighlightDiff";
import { useAdkPortfolioReviewStore } from "../stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore } from "../stores/useAdkResumeReviewStore";
import { isMutatingPortfolioTool, isMutatingResumeTool } from "../streaming/stream-activity";
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
  /** True while PATCHing session context before send or while SSE stream is active. */
  isLoading: boolean;
  currentAgent: string;
  /** User-facing line derived from streaming agent/tool events (sidebar UX). */
  streamActivityLabel: string | null;
  submitMessage: (message: string, options?: { aiMessageId?: string; sessionIdOverride?: string }) => Promise<void>;
}

const WAKING_UP_LABEL = "Waking up Unibot…";

type AdkStateSyncSource =
  | "zustand"
  | "react_query"
  | "list_zustand"
  | "portfolio_zustand"
  | "portfolio_react_query"
  | "content_gen_studio"
  | "application_asset_studio"
  | "clear_context"
  | "linkedin_query";

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
  const lastResumeStoreFingerprintRef = useRef<string | null>(null);
  const lastPortfolioStoreFingerprintRef = useRef<string | null>(null);
  const suppressStoreSyncRef = useRef(false);
  const [isSyncingContext, setIsSyncingContext] = useState(false);
  const sessionPullDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Captures resume snapshot before ADK session GET applies mutating tool results (avoids racing after_stream). */
  const pendingPrePullBaselineRef = useRef<ResumeData | null>(null);
  const pendingPortfolioPrePullBaselineRef = useRef<PortfolioData | null>(null);
  /** Captures assistant bubble id for the in-flight stream (review cards attach to this message). */
  const pendingReviewAssistantIdRef = useRef<string | null>(null);
  const [streamActivityLabel, setStreamActivityLabel] = useState<string | null>(null);
  const resumeId = useMemo(() => {
    const raw = searchParams.get("id");
    return raw && raw.trim().length > 0 ? raw.trim() : null;
  }, [searchParams]);

  const isLinkedInRoute = pathname.startsWith("/uniboard/linkedin");
  const { data: linkedInSnapshot } = useLinkedInAnalysis({ enabled: isLinkedInRoute });

  const getCurrentPortfolioId = useCallback(() => {
    if (!pathname.startsWith("/uniboard/portfolio")) {
      return null;
    }
    const queryPortfolio = queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
    const allStorePortfolios = usePortfolioStore.getState().portfolioData;
    return queryPortfolio?.id ?? Object.keys(allStorePortfolios).find(id => allStorePortfolios[id]) ?? null;
  }, [pathname, queryClient]);

  const { isLoading: isStreamLoading, currentAgent, startStream } = useAdkStreaming(retryWithBackoff);
  const isLoading = isSyncingContext || isStreamLoading;

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (!isStreamLoading && !isSyncingContext) {
      setStreamActivityLabel(null);
    }
  }, [isStreamLoading, isSyncingContext]);

  useEffect(() => {
    return () => {
      if (sessionPullDebounceRef.current) {
        clearTimeout(sessionPullDebounceRef.current);
      }
    };
  }, []);

  const getStateDeltaForCurrentRoute = useCallback((): {
    stateDelta: Record<string, unknown>;
    source: AdkStateSyncSource;
  } => {
    const isResumeRoute = pathname.startsWith("/uniboard/resume");
    const isPortfolioRoute = pathname.startsWith("/uniboard/portfolio");
    const isStudioRoute = pathname.startsWith("/uniboard/studio");
    const allStoreResumes = useResumeStore.getState().resumeData;
    const allStorePortfolios = usePortfolioStore.getState().portfolioData;
    const warmResumeData = buildAdkResumeDataMap(allStoreResumes);
    const warmPortfolioData = buildAdkPortfolioDataMap(allStorePortfolios);

    if (isLinkedInRoute) {
      const snapshot = linkedInSnapshot ?? queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
      if (snapshot?.result) {
        return {
          stateDelta: buildAdkLinkedInStateDelta(snapshot),
          source: "linkedin_query",
        };
      }
      return {
        stateDelta: {
          active_context: "linkedin",
          current_linkedin: null,
          linkedin_data: {},
        },
        source: "linkedin_query",
      };
    }

    if (isStudioRoute) {
      const studioTypeParam = searchParams.get("type");
      const documentTopics: ApplicationAssetStudioTopic[] = ["cover-letter", "cold-email", "referral"];
      const isDocumentStudioTopic = (t: string | null): t is ApplicationAssetStudioTopic =>
        Boolean(t && documentTopics.includes(t as ApplicationAssetStudioTopic));
      if (isDocumentStudioTopic(studioTypeParam)) {
        const aa = useApplicationAssetStudioStore.getState();
        const apiType = STUDIO_TOPIC_TO_API_TYPE[studioTypeParam];
        return {
          stateDelta: buildAdkApplicationAssetStateDelta({
            assetType: apiType,
            assetId: aa.assetId,
            applicationId: aa.applicationId,
            role: aa.role,
            company: aa.company,
            jobDescription: aa.jobDescription,
            contactName: aa.contactName,
            draftPreview: aa.draftPreview,
            acceptedBody: aa.acceptedContent,
          }),
          source: "application_asset_studio",
        };
      }
      const cg = useContentGenStudioStore.getState();
      return {
        stateDelta: buildAdkContentGenStateDelta({
          topic: cg.topic,
          funnel: cg.funnel,
          assetId: cg.assetId,
          draftPreview: cg.draftPreview,
        }),
        source: "content_gen_studio",
      };
    }

    if (isPortfolioRoute) {
      const queryPortfolio = queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
      const activePortfolioId = queryPortfolio?.id ?? Object.keys(allStorePortfolios).find(id => allStorePortfolios[id]) ?? null;
      const storePortfolio = activePortfolioId ? usePortfolioStore.getState().getPortfolioData(activePortfolioId) : undefined;
      const sourcePortfolio = storePortfolio ?? queryPortfolio ?? null;

      if (sourcePortfolio?.id) {
        const mergedPortfolios = {
          ...allStorePortfolios,
          [sourcePortfolio.id]: sourcePortfolio,
        };
        const base = buildAdkPortfolioStateDelta(sourcePortfolio);
        return {
          stateDelta: {
            ...base,
            portfolio_data: buildAdkPortfolioDataMap(mergedPortfolios),
            resume_data: warmResumeData,
            current_resume: null,
          },
          source: storePortfolio ? "portfolio_zustand" : "portfolio_react_query",
        };
      }

      return {
        stateDelta: {
          active_context: "portfolio",
          current_portfolio: null,
          portfolio_data: warmPortfolioData,
          resume_data: warmResumeData,
          current_resume: null,
        },
        source: "portfolio_zustand",
      };
    }

    if (isResumeRoute && !resumeId) {
      return {
        stateDelta: {
          active_context: "resume",
          current_resume: null,
          resume_data: warmResumeData,
          portfolio_data: warmPortfolioData,
          current_portfolio: null,
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
            portfolio_data: warmPortfolioData,
            current_portfolio: null,
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
        current_portfolio: null,
        portfolio_data: {},
      },
      source: "clear_context",
    };
  }, [pathname, resumeId, searchParams, queryClient, linkedInSnapshot, isLinkedInRoute]);

  /** Snapshot current route context into ADK session (call once per user send). */
  const patchSessionContextBeforeSend = useCallback(
    async (targetSessionId: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId || !targetSessionId) {
        return { success: false, error: "userId and sessionId are required" };
      }

      const { stateDelta, source } = getStateDeltaForCurrentRoute();

      console.log("📤 [ADK STATE SYNC] PATCH session state (before_send)", {
        sessionId: targetSessionId,
        resumeId,
        source,
        keys: Object.keys(stateDelta),
        activeContext: stateDelta.active_context,
        patchedResumeId: stateDelta.current_resume,
        patchedPortfolioId: stateDelta.current_portfolio,
        portfolioDataCount:
          stateDelta.portfolio_data && typeof stateDelta.portfolio_data === "object"
            ? Object.keys(stateDelta.portfolio_data as Record<string, unknown>).length
            : 0,
      });

      const syncResult = await syncSessionStateAction(userId, targetSessionId, {
        ...stateDelta,
        django_username: userId,
      });
      if (!syncResult.success) {
        console.warn("⚠️ [ADK STREAMING] Session PATCH sync failed", {
          sessionId: targetSessionId,
          error: syncResult.error,
        });
        return {
          success: false,
          error: syncResult.error ?? "Could not sync your editor context with Unibot.",
        };
      }

      console.log("✅ [ADK STATE SYNC] PATCH success (before_send)", {
        sessionId: targetSessionId,
        resumeId,
        source,
      });
      return { success: true };
    },
    [userId, resumeId, getStateDeltaForCurrentRoute]
  );

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
          lastResumeStoreFingerprintRef.current = nextStoreFingerprint;
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

  const syncPortfolioStoreFromSessionState = useCallback(
    async (reason: "after_stream" | "after_tool_response"): Promise<void> => {
      if (!userId || !sessionId) {
        return;
      }

      const toolDiffBaseline = reason === "after_tool_response" ? pendingPortfolioPrePullBaselineRef.current : null;

      try {
        const pullResult = await pullSessionStateAction(userId, sessionId);
        if (!pullResult.success || !pullResult.state) {
          if (!pullResult.success) {
            console.warn("⚠️ [ADK STATE SYNC] Portfolio session GET failed", {
              sessionId,
              reason,
              error: pullResult.error,
            });
          }
          return;
        }

        const nextPortfolios = mapAdkPortfolioDataMapToFrontend(pullResult.state.portfolio_data);
        const store = usePortfolioStore.getState();
        const currentPortfolioIdRaw = pullResult.state.current_portfolio;
        const currentPortfolioId =
          typeof currentPortfolioIdRaw === "string" && currentPortfolioIdRaw.trim().length > 0 ? currentPortfolioIdRaw.trim() : null;
        const sourcePortfolio = currentPortfolioId ? nextPortfolios[currentPortfolioId] : undefined;
        const currentStoreFingerprint = JSON.stringify(store.portfolioData);
        const nextStoreFingerprint = JSON.stringify(nextPortfolios);

        if (currentStoreFingerprint === nextStoreFingerprint) {
          return;
        }

        if (reason === "after_tool_response" && toolDiffBaseline && currentPortfolioId && sourcePortfolio) {
          const { highlights, bannerTitle } = computeAdkPortfolioReviewFromDiff(toolDiffBaseline, sourcePortfolio);
          if (Object.keys(highlights).length > 0) {
            useAdkPortfolioReviewStore.getState().beginReview({
              portfolioId: currentPortfolioId,
              baselinePortfolio: toolDiffBaseline,
              highlights,
              bannerTitle,
              assistantMessageId: pendingReviewAssistantIdRef.current,
            });
          }
        }

        suppressStoreSyncRef.current = true;
        try {
          usePortfolioStore.setState({ portfolioData: nextPortfolios });
          if (currentPortfolioId && sourcePortfolio) {
            queryClient.setQueryData(portfolioQueryKey, sourcePortfolio);
          }
          console.log("✅ [ADK STATE SYNC] Portfolio session GET applied to store", {
            reason,
            sessionId,
            currentPortfolioId,
            portfolioCount: Object.keys(nextPortfolios).length,
          });
        } finally {
          suppressStoreSyncRef.current = false;
          lastPortfolioStoreFingerprintRef.current = nextStoreFingerprint;
        }
      } finally {
        if (reason === "after_tool_response") {
          pendingPortfolioPrePullBaselineRef.current = null;
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

  const schedulePortfolioPullAfterMutatingTool = useCallback(() => {
    if (sessionPullDebounceRef.current) {
      clearTimeout(sessionPullDebounceRef.current);
    }
    sessionPullDebounceRef.current = setTimeout(() => {
      sessionPullDebounceRef.current = null;
      void syncPortfolioStoreFromSessionState("after_tool_response");
    }, 220);
  }, [syncPortfolioStoreFromSessionState]);

  const streamExtras = useMemo(
    () => ({
      onMutatingToolResponse: (toolName: string, aiMessageId: string) => {
        pendingReviewAssistantIdRef.current = aiMessageId;
        if (isMutatingResumeTool(toolName) && resumeId) {
          const cur = useResumeStore.getState().getResumeData(resumeId);
          if (cur && !pendingPrePullBaselineRef.current) {
            pendingPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as ResumeData;
          }
          scheduleResumePullAfterMutatingTool();
        }
        const activePortfolioId = getCurrentPortfolioId();
        if (isMutatingPortfolioTool(toolName) && activePortfolioId) {
          const cur = usePortfolioStore.getState().getPortfolioData(activePortfolioId);
          if (cur && !pendingPortfolioPrePullBaselineRef.current) {
            pendingPortfolioPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as PortfolioData;
          }
          schedulePortfolioPullAfterMutatingTool();
        }
      },
      onStreamActivityHint: ({ label }: { label: string }) => {
        setStreamActivityLabel(label);
      },
    }),
    [scheduleResumePullAfterMutatingTool, schedulePortfolioPullAfterMutatingTool, resumeId, getCurrentPortfolioId]
  );

  const submitMessage = useCallback(
    async (message: string, options?: { aiMessageId?: string; sessionIdOverride?: string }): Promise<void> => {
      const targetSessionId = options?.sessionIdOverride?.trim() || sessionId;
      if (!message.trim() || !userId || !targetSessionId) {
        throw new Error("Message, userId, and sessionId are required");
      }

      setIsSyncingContext(true);
      setStreamActivityLabel(WAKING_UP_LABEL);
      try {
        const patchResult = await patchSessionContextBeforeSend(targetSessionId);
        if (!patchResult.success) {
          throw new Error(patchResult.error ?? "Could not sync your editor context with Unibot.");
        }
      } finally {
        setIsSyncingContext(false);
      }

      setStreamActivityLabel(null);
      pendingReviewAssistantIdRef.current = options?.aiMessageId ?? null;

      await startStream(
        {
          message: message.trim(),
          userId,
          sessionId: targetSessionId,
          aiMessageId: options?.aiMessageId,
        },
        onMessageUpdate,
        onEventUpdate,
        onWebsiteCountUpdate,
        streamExtras
      );
      const isSubSend = Boolean(options?.sessionIdOverride && options.sessionIdOverride !== sessionId);
      if (!isSubSend) {
        if (pathname.startsWith("/uniboard/portfolio")) {
          await syncPortfolioStoreFromSessionState("after_stream");
        } else if (pathname.startsWith("/uniboard/resume")) {
          await syncResumeStoreFromSessionState("after_stream");
        }
      }
    },
    [
      userId,
      sessionId,
      pathname,
      startStream,
      onMessageUpdate,
      onEventUpdate,
      onWebsiteCountUpdate,
      patchSessionContextBeforeSend,
      syncResumeStoreFromSessionState,
      syncPortfolioStoreFromSessionState,
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
