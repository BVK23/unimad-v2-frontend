"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useCoachActAsSession } from "@/contexts/CoachActAsContext";
import { syncSessionStateAction } from "@/features/adk-chat/actions";
import { buildApplicationAssetStateDeltaFromStudio } from "@/features/application-assets/api/buildApplicationAssetStateDeltaFromStudio";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import { STUDIO_TOPIC_TO_API_TYPE, type ApplicationAssetStudioTopic } from "@/features/application-assets/types";
import { getApplicationsFromQueryClient } from "@/features/application-tracker/hooks/useApplications";
import { buildAdkContentGenStateDelta } from "@/features/content-lab/api/adk-mappers";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta, mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey, portfolioQueryKeyFor } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { applyMutatingToolSessionPull, syncContentGenDraftPreviewOnly } from "@/src/features/adk-chat/apply-mutating-tool-session-pull";
import { deriveActiveScope, deriveScopeFromRegistryRow, type ContentScope } from "@/src/features/adk-chat/content-scope";
import { resolveActiveResumeIdForPatch } from "@/src/features/adk-chat/resolve-active-resume-id";
import {
  mergePrepareApplicationIntoResumeStateDelta,
  resolveApplicationContextForResumePatch,
} from "@/src/features/adk-chat/resolve-prepare-application-for-adk";
import { resolveAdkSessionOptionsForSessionId } from "@/src/features/adk-chat/resolve-sub-session-adk-app";
import { noteAdkSessionSynced } from "@/src/features/adk-chat/rewind-state-divergence";
import { noteSessionMutatingTool } from "@/src/features/adk-chat/session-mutating-tool-tracker";
import { getRegistryRow } from "@/src/features/adk-chat/session-registry";
import { isAdkActivityTraceEnabled } from "@/src/features/adk-chat/streaming/activity-trace";
import {
  buildAdkLinkedInStateDelta,
  mapSnapshotToLinkedInSessionProfile,
  type LinkedInSessionProfile,
} from "@/src/features/linkedin/api/adk-mappers";
import { linkedinAnalysisQueryKey, useLinkedInAnalysis } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import type { LinkedInAnalysisSnapshot } from "@/src/features/linkedin/types";
import { buildAdkResumeDataMap, buildAdkResumeStateDelta, mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { resumesListQueryKey } from "@/src/features/resume/hooks/useResumesList";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import { UNIBOT_AGENT_LOADING_EVENT, UNIBOT_STREAM_ACTIVITY_EVENT, type UnibotStreamActivityDetail } from "@/src/hooks/useUnibotAgentBusy";
import { SYNCING_CONTEXT_LABEL } from "@/src/hooks/useUnibotStreamActivityLabel";
import type { PortfolioData, ResumeData } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { checkAdkRequestRateLimit, ADK_REQUEST_RATE_LIMIT_MESSAGE } from "../adk-request-rate-limit";
import {
  attachOptimisticAssistantMessage,
  beginOptimisticUnibotActivity,
  registerOptimisticUnibotActivityHandlers,
} from "../optimistic-unibot-activity";
import {
  isMutatingApplicationAssetTool,
  isMutatingContentGenTool,
  isMutatingLinkedInTool,
  isMutatingPortfolioTool,
  isMutatingResumeTool,
  completionMessageForMutatingTool,
  resolveContentGenActivityLabelHint,
  toSnakeToolKey,
} from "../streaming/stream-activity";
import {
  createStreamActivityHeartbeat,
  resolveStreamHeartbeatLabels,
  type StreamActivityHeartbeat,
} from "../streaming/stream-activity-heartbeat";
import { createStreamActivityPresenter, type StreamActivityPresenter } from "../streaming/stream-activity-presenter";
import {
  clearStreamActivitySnapshot,
  getStreamActivitySnapshot,
  setStreamActivitySnapshot,
  subscribeStreamActivity,
} from "../streaming/stream-activity-store";
import type { AgentMessage, ProcessedEvent } from "../types";
import { isStreamingMachineReadablePayloadOnly } from "../utils/strip-machine-readable-payload";
import { useAdkStreaming } from "./useAdkStreaming";
import { useBackendHealth } from "./useBackendHealth";

export interface UseAdkStreamingManagerParams {
  userId: string;
  sessionId: string;
  onMessageUpdate: (message: AgentMessage) => void;
  onEventUpdate: (messageId: string, event: ProcessedEvent) => void;
  onWebsiteCountUpdate: (count: number) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onNavigationSuggestion?: (aiMessageId: string, navigation: { path: string; label: string }) => void;
  onJobCardsSuggestion?: (aiMessageId: string, payload: import("../parse-unimad-job-cards").UnimadJobCardsPayload) => void;
  onLinkedInSuggestions?: (
    aiMessageId: string,
    payload: import("../parse-unimad-linkedin-suggestions").UnimadLinkedInSuggestionsPayload
  ) => void;
}

export interface UseAdkStreamingManagerReturn {
  /** True while PATCHing session context before send or while SSE stream is active. */
  isLoading: boolean;
  currentAgent: string;
  /** User-facing line derived from streaming agent/tool events (sidebar UX). */
  streamActivityLabel: string | null;
  /** True only while PATCHing session context before the SSE stream starts. */
  isSyncingContext: boolean;
  submitMessage: (
    message: string,
    options?: { aiMessageId?: string; sessionIdOverride?: string; patchResumeId?: string }
  ) => Promise<{ hadAssistantText: boolean }>;
}

function dispatchStreamActivity(detail: UnibotStreamActivityDetail): void {
  if (typeof window === "undefined") return;
  if (detail.activityLabel?.trim()) {
    setStreamActivitySnapshot({
      activityLabel: detail.activityLabel.trim(),
      assistantMessageId: detail.assistantMessageId?.trim() || null,
      submitInFlight: detail.loading !== false,
    });
  } else if (detail.loading === false) {
    clearStreamActivitySnapshot();
  }
  window.dispatchEvent(new CustomEvent(UNIBOT_STREAM_ACTIVITY_EVENT, { detail }));
  window.dispatchEvent(
    new CustomEvent(UNIBOT_AGENT_LOADING_EVENT, {
      detail: { loading: detail.loading ?? true, activityLabel: detail.activityLabel },
    })
  );
}

type AdkStateSyncSource =
  | "zustand"
  | "react_query"
  | "list_zustand"
  | "portfolio_zustand"
  | "portfolio_react_query"
  | "content_gen_studio"
  | "application_asset_studio"
  | "jobs_query"
  | "clear_context"
  | "linkedin_query"
  | "resume_id_only";

export function useAdkStreamingManager({
  userId,
  sessionId,
  onMessageUpdate,
  onEventUpdate,
  onWebsiteCountUpdate,
  onLoadingChange,
  onNavigationSuggestion,
  onJobCardsSuggestion,
  onLinkedInSuggestions,
}: UseAdkStreamingManagerParams): UseAdkStreamingManagerReturn {
  const { retryWithBackoff } = useBackendHealth();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const coachActAs = useCoachActAsSession();
  const livePortfolioQueryKey = useMemo(() => portfolioQueryKeyFor(coachActAs), [coachActAs]);
  const lastResumeStoreFingerprintRef = useRef<string | null>(null);
  const lastPortfolioStoreFingerprintRef = useRef<string | null>(null);
  const suppressStoreSyncRef = useRef(false);
  const [isSyncingContext, setIsSyncingContext] = useState(false);
  const [isSubmitInFlight, setIsSubmitInFlight] = useState(false);
  /** Captures resume snapshot before ADK session GET applies mutating tool results (avoids racing after_stream). */
  const pendingPrePullBaselineRef = useRef<ResumeData | null>(null);
  const pendingPortfolioPrePullBaselineRef = useRef<PortfolioData | null>(null);
  const pendingLinkedInPrePullBaselineRef = useRef<LinkedInSessionProfile | null>(null);
  /** Sub-session sends (improve threads) write to a different ADK session id than the main chat. */
  const pendingPullSessionIdRef = useRef<string | null>(null);
  /** Captures assistant bubble id for the in-flight stream (review cards attach to this message). */
  const pendingReviewAssistantIdRef = useRef<string | null>(null);
  const pendingMutatingToolRef = useRef<string | null>(null);
  const streamHadSidebarContentRef = useRef(false);
  const streamInFlightRef = useRef(false);
  const optimisticActivityStartedRef = useRef(false);
  const contentGenPreviewPullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityPresenterRef = useRef<StreamActivityPresenter | null>(null);
  const streamHeartbeatRef = useRef<StreamActivityHeartbeat | null>(null);
  if (activityPresenterRef.current === null) {
    activityPresenterRef.current = createStreamActivityPresenter({
      onPresent: ({ label, assistantMessageId }) => {
        setStreamActivitySnapshot({ activityLabel: label, assistantMessageId, submitInFlight: true });
        setStreamActivityLabel(label);
        dispatchStreamActivity({
          loading: true,
          activityLabel: label,
          assistantMessageId,
        });
      },
    });
  }
  if (streamHeartbeatRef.current === null) {
    streamHeartbeatRef.current = createStreamActivityHeartbeat({
      labels: ["Working with Unibot…"],
      onTick: label => {
        activityPresenterRef.current?.enqueue(label);
      },
    });
  }
  const [streamActivityLabel, setStreamActivityLabel] = useState<string | null>(null);

  useEffect(() => {
    registerOptimisticUnibotActivityHandlers({
      onBegin: ({ assistantMessageId }) => {
        optimisticActivityStartedRef.current = true;
        if (assistantMessageId) {
          pendingReviewAssistantIdRef.current = assistantMessageId;
          activityPresenterRef.current?.setAssistantMessageId(assistantMessageId);
        }
      },
      onCancel: () => {
        optimisticActivityStartedRef.current = false;
        clearStreamActivitySnapshot();
      },
    });
    return () => registerOptimisticUnibotActivityHandlers(null);
  }, []);

  const resolveResumeIdForSessionPull = useCallback((): string | null => {
    const activeId = resolveActiveResumeIdForPatch(searchParams);
    if (activeId?.trim()) return activeId.trim();
    const keys = Object.keys(useResumeStore.getState().resumeData);
    return keys[0] ?? null;
  }, [searchParams]);

  const captureResumeBaselineBeforeMutatingPull = useCallback(
    (scopeOverride: ContentScope | null): void => {
      if (pendingPrePullBaselineRef.current) return;
      const isResumeContext = scopeOverride?.domain === "resume" || pathname.startsWith("/uniboard/resume");
      if (!isResumeContext) return;

      const fromScope = scopeOverride?.domain === "resume" ? scopeOverride.contentKey.split(":")[1]?.trim() : "";
      const id = (fromScope && fromScope !== "active" ? fromScope : null) ?? resolveResumeIdForSessionPull();
      if (!id) return;

      const cur = useResumeStore.getState().getResumeData(id);
      if (cur) {
        pendingPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as ResumeData;
      }
    },
    [pathname, resolveResumeIdForSessionPull]
  );

  const isLinkedInRoute = pathname.startsWith("/uniboard/linkedin");
  const { data: linkedInSnapshot } = useLinkedInAnalysis({ enabled: isLinkedInRoute });

  const getCurrentPortfolioId = useCallback(() => {
    if (!pathname.startsWith("/uniboard/portfolio")) {
      return null;
    }
    const queryPortfolio =
      queryClient.getQueryData<PortfolioData | null>(livePortfolioQueryKey) ??
      queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
    const allStorePortfolios = usePortfolioStore.getState().portfolioData;
    return queryPortfolio?.id ?? Object.keys(allStorePortfolios).find(id => allStorePortfolios[id]) ?? null;
  }, [pathname, queryClient, livePortfolioQueryKey]);

  const { isLoading: isStreamLoading, currentAgent, startStream } = useAdkStreaming(retryWithBackoff);
  const liveSubmitInFlight = useSyncExternalStore(
    subscribeStreamActivity,
    () => getStreamActivitySnapshot().submitInFlight,
    () => false
  );
  const isLoading = isSubmitInFlight || isStreamLoading || liveSubmitInFlight;

  const handleMessageUpdate = useCallback(
    (am: AgentMessage) => {
      onMessageUpdate(am);
      const text = am.content?.trim() ?? "";
      // Keep activity labels visible for the whole stream — tool-heavy turns clear too early otherwise.
      if (text && !isStreamingMachineReadablePayloadOnly(text) && !streamInFlightRef.current) {
        if (activityPresenterRef.current?.isPacing()) {
          return;
        }
        clearStreamActivitySnapshot();
        setStreamActivityLabel(null);
      }
    },
    [onMessageUpdate]
  );

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const clearMutatingPullBaselines = useCallback((): void => {
    pendingPrePullBaselineRef.current = null;
    pendingPortfolioPrePullBaselineRef.current = null;
    pendingLinkedInPrePullBaselineRef.current = null;
  }, []);

  const getStateDeltaForCurrentRoute = useCallback(
    (
      resumeIdOverride?: string | null
    ): {
      stateDelta: Record<string, unknown>;
      source: AdkStateSyncSource;
    } => {
      const activeResumeId = resumeIdOverride?.trim() || resolveActiveResumeIdForPatch(searchParams);
      const isResumeRoute = pathname.startsWith("/uniboard/resume");
      const isPortfolioRoute = pathname.startsWith("/uniboard/portfolio");
      const isStudioRoute = pathname.startsWith("/uniboard/studio");
      const isJobsRoute = pathname.startsWith("/uniboard/jobs");
      const allStoreResumes = useResumeStore.getState().resumeData;
      const allStorePortfolios = usePortfolioStore.getState().portfolioData;
      const warmResumeData = buildAdkResumeDataMap(allStoreResumes);
      const warmPortfolioData = buildAdkPortfolioDataMap(allStorePortfolios);
      const applications = getApplicationsFromQueryClient(queryClient);
      const mergeResumeApplicationContext = (
        delta: Record<string, unknown>,
        resume?: { applicationId?: string | null; jobId?: string | null } | null
      ) => mergePrepareApplicationIntoResumeStateDelta(delta, resolveApplicationContextForResumePatch(searchParams, applications, resume));

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
        const studioTypeParam = searchParams?.get("type") ?? null;
        const documentTopics: ApplicationAssetStudioTopic[] = ["cover-letter", "cold-email", "referral"];
        const isDocumentStudioTopic = (t: string | null): t is ApplicationAssetStudioTopic =>
          Boolean(t && documentTopics.includes(t as ApplicationAssetStudioTopic));
        if (isDocumentStudioTopic(studioTypeParam)) {
          const aa = useApplicationAssetStudioStore.getState();
          return {
            stateDelta: buildApplicationAssetStateDeltaFromStudio(aa, {
              assetType: STUDIO_TOPIC_TO_API_TYPE[studioTypeParam],
            }),
            source: "application_asset_studio",
          };
        }
        const cg = useContentGenStudioStore.getState();
        return {
          stateDelta: buildAdkContentGenStateDelta({
            topic: cg.topic,
            funnel: cg.funnel,
            mood: cg.mood,
            assetId: cg.assetId,
            draftPreview: cg.draftPreview,
          }),
          source: "content_gen_studio",
        };
      }

      if (isJobsRoute) {
        const tab = (searchParams?.get("tab") || "discovery").toLowerCase();
        const activeContext = tab === "tracker" ? "application_tracker" : tab === "interview" ? "interview_prep" : "jobs";
        return {
          stateDelta: {
            active_context: activeContext,
            application_tracker_data: applications,
            interview_prep_data: {},
          },
          source: "jobs_query",
        };
      }

      if (isPortfolioRoute) {
        const queryPortfolio =
          queryClient.getQueryData<PortfolioData | null>(livePortfolioQueryKey) ??
          queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
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

      if (isResumeRoute && !activeResumeId) {
        return {
          stateDelta: mergeResumeApplicationContext({
            active_context: "resume",
            current_resume: null,
            resume_data: warmResumeData,
            portfolio_data: warmPortfolioData,
            current_portfolio: null,
          }),
          source: "list_zustand",
        };
      }

      if (isResumeRoute && activeResumeId) {
        const storeResume = useResumeStore.getState().getResumeData(activeResumeId);
        const queryResume = queryClient.getQueryData<ResumeData>(resumeByIdQueryKey(activeResumeId));
        const listResume = queryClient
          .getQueryData<ResumeData[]>(resumesListQueryKey)
          ?.find(resume => String(resume.id) === String(activeResumeId));
        const sourceResume = storeResume ?? queryResume ?? listResume;

        if (sourceResume) {
          const mergedResumes = {
            ...allStoreResumes,
            [activeResumeId]: { ...sourceResume, id: activeResumeId },
          };
          const base = buildAdkResumeStateDelta({ ...sourceResume, id: activeResumeId });
          return {
            stateDelta: mergeResumeApplicationContext(
              {
                ...base,
                resume_data: buildAdkResumeDataMap(mergedResumes),
                portfolio_data: warmPortfolioData,
                current_portfolio: null,
              },
              sourceResume
            ),
            source: storeResume ? "zustand" : "react_query",
          };
        }

        const warmOnly = allStoreResumes[activeResumeId];
        if (warmOnly) {
          const mergedResumes = { ...allStoreResumes, [activeResumeId]: { ...warmOnly, id: activeResumeId } };
          return {
            stateDelta: mergeResumeApplicationContext(
              {
                ...buildAdkResumeStateDelta({ ...warmOnly, id: activeResumeId }),
                resume_data: buildAdkResumeDataMap(mergedResumes),
                portfolio_data: warmPortfolioData,
                current_portfolio: null,
              },
              warmOnly
            ),
            source: "zustand",
          };
        }

        return {
          stateDelta: mergeResumeApplicationContext({
            active_context: "resume",
            current_resume: activeResumeId,
            resume_data: warmResumeData,
            portfolio_data: warmPortfolioData,
            current_portfolio: null,
          }),
          source: "resume_id_only",
        };
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
    },
    [pathname, searchParams, queryClient, linkedInSnapshot, isLinkedInRoute, livePortfolioQueryKey]
  );

  const getStateDeltaForScope = useCallback(
    (scope: ContentScope): { stateDelta: Record<string, unknown>; source: AdkStateSyncSource } => {
      const applications = getApplicationsFromQueryClient(queryClient);
      const mergeResumeApplicationContext = (
        delta: Record<string, unknown>,
        resume?: { applicationId?: string | null; jobId?: string | null } | null
      ) => mergePrepareApplicationIntoResumeStateDelta(delta, resolveApplicationContextForResumePatch(searchParams, applications, resume));

      if (scope.domain === "resume") {
        const allStoreResumes = useResumeStore.getState().resumeData;
        const warmPortfolioData = buildAdkPortfolioDataMap(usePortfolioStore.getState().portfolioData);
        const resumeKey = scope.contentKey.split(":")[1] ?? "";
        let scopedResumeId = resumeKey && resumeKey !== "active" ? resumeKey : null;
        if (!scopedResumeId) {
          scopedResumeId = resolveActiveResumeIdForPatch(searchParams);
        }
        const sourceResume = scopedResumeId ? useResumeStore.getState().getResumeData(scopedResumeId) : undefined;
        const queryResume = scopedResumeId ? queryClient.getQueryData<ResumeData>(resumeByIdQueryKey(scopedResumeId)) : undefined;
        const listResume = scopedResumeId
          ? queryClient.getQueryData<ResumeData[]>(resumesListQueryKey)?.find(r => String(r.id) === String(scopedResumeId))
          : undefined;
        const resolvedResume = sourceResume ?? queryResume ?? listResume;
        if (resolvedResume && scopedResumeId) {
          return {
            stateDelta: mergeResumeApplicationContext(
              {
                ...buildAdkResumeStateDelta({ ...resolvedResume, id: scopedResumeId }),
                resume_data: buildAdkResumeDataMap({ ...allStoreResumes, [scopedResumeId]: resolvedResume }),
                portfolio_data: warmPortfolioData,
                current_portfolio: null,
              },
              resolvedResume
            ),
            source: sourceResume ? "zustand" : "react_query",
          };
        }
        if (scopedResumeId) {
          return {
            stateDelta: mergeResumeApplicationContext({
              active_context: "resume",
              current_resume: scopedResumeId,
              resume_data: buildAdkResumeDataMap(allStoreResumes),
              portfolio_data: warmPortfolioData,
              current_portfolio: null,
            }),
            source: "resume_id_only",
          };
        }
      }

      if (scope.domain === "portfolio") {
        const allStorePortfolios = usePortfolioStore.getState().portfolioData;
        const queryPortfolio =
          queryClient.getQueryData<PortfolioData | null>(livePortfolioQueryKey) ??
          queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
        const sourcePortfolio = queryPortfolio ?? Object.values(allStorePortfolios)[0] ?? null;
        const warmResumeData = buildAdkResumeDataMap(useResumeStore.getState().resumeData);
        if (sourcePortfolio?.id) {
          return {
            stateDelta: {
              ...buildAdkPortfolioStateDelta(sourcePortfolio),
              portfolio_data: buildAdkPortfolioDataMap({ ...allStorePortfolios, [sourcePortfolio.id]: sourcePortfolio }),
              resume_data: warmResumeData,
              current_resume: null,
            },
            source: "portfolio_zustand",
          };
        }
      }

      if (scope.domain === "application_asset") {
        const aa = useApplicationAssetStudioStore.getState();
        const typePart = scope.contentKey.split(":")[1];
        const scopedType = typePart === "coverletter" || typePart === "coldemail" || typePart === "referral" ? typePart : aa.assetType;
        return {
          stateDelta: buildApplicationAssetStateDeltaFromStudio(aa, {
            assetType: scopedType ?? aa.assetType ?? undefined,
          }),
          source: "application_asset_studio",
        };
      }

      if (scope.domain === "content_gen") {
        const cg = useContentGenStudioStore.getState();
        return {
          stateDelta: buildAdkContentGenStateDelta({
            topic: cg.topic,
            funnel: cg.funnel,
            mood: cg.mood,
            assetId: cg.assetId,
            draftPreview: cg.draftPreview,
          }),
          source: "content_gen_studio",
        };
      }

      if (scope.domain === "linkedin") {
        const snapshot = linkedInSnapshot ?? queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
        if (snapshot?.result) {
          return {
            stateDelta: buildAdkLinkedInStateDelta(snapshot),
            source: "linkedin_query",
          };
        }
      }

      return getStateDeltaForCurrentRoute();
    },
    [getStateDeltaForCurrentRoute, linkedInSnapshot, queryClient, searchParams, livePortfolioQueryKey]
  );

  /** Snapshot current route context into ADK session (call once per user send). */
  const patchSessionContextBeforeSend = useCallback(
    async (
      targetSessionId: string,
      scopeOverride?: ContentScope | null,
      resumeIdOverride?: string | null,
      outboundUserText?: string | null
    ): Promise<{ success: boolean; effectiveAppName?: string; error?: string }> => {
      if (!userId || !targetSessionId) {
        return { success: false, error: "userId and sessionId are required" };
      }

      const { stateDelta } = scopeOverride ? getStateDeltaForScope(scopeOverride) : getStateDeltaForCurrentRoute(resumeIdOverride);

      const subThreadExtras: Record<string, unknown> = {};
      if (scopeOverride?.sessionKind === "sub") {
        const row = getRegistryRow(targetSessionId);
        if (scopeOverride.domain === "content_gen") {
          const section = (row?.section ?? scopeOverride.section ?? "").trim().toLowerCase();
          subThreadExtras.content_gen_thread_mode = section === "topic" ? "topic" : "draft";
        }
        if (scopeOverride.domain === "resume" && row?.section) {
          subThreadExtras.resume_improve_section = row.section;
          const entryId = (row.entry_id ?? "").trim();
          if (entryId) {
            subThreadExtras.resume_improve_entry_id = entryId;
          }
        }
      }

      const adkSessionOptions = resolveAdkSessionOptionsForSessionId(targetSessionId);

      const syncResult = await syncSessionStateAction(
        userId,
        targetSessionId,
        {
          ...stateDelta,
          ...subThreadExtras,
          django_username: userId,
        },
        adkSessionOptions
      );
      if (!syncResult.success) {
        return {
          success: false,
          error: syncResult.error ?? "Could not sync your editor context with Unibot.",
        };
      }

      const registryRow = getRegistryRow(targetSessionId);
      const syncedScope =
        scopeOverride ??
        (registryRow
          ? deriveScopeFromRegistryRow(registryRow)
          : deriveActiveScope({
              pathname,
              searchParams,
              sessionId: targetSessionId,
              sessionKind: "main",
            }));
      noteAdkSessionSynced(syncedScope);

      return { success: true, effectiveAppName: syncResult.effectiveAppName };
    },
    [userId, getStateDeltaForCurrentRoute, getStateDeltaForScope, pathname, searchParams]
  );

  const noteMutatingToolDuringStream = useCallback((toolName: string, aiMessageId: string) => {
    pendingMutatingToolRef.current = toolName;
    pendingReviewAssistantIdRef.current = aiMessageId;
  }, []);

  const scheduleContentGenPreviewPull = useCallback(
    (pullSessionId: string) => {
      if (!userId) return;
      if (contentGenPreviewPullTimerRef.current) {
        clearTimeout(contentGenPreviewPullTimerRef.current);
      }
      contentGenPreviewPullTimerRef.current = setTimeout(() => {
        contentGenPreviewPullTimerRef.current = null;
        if (!streamInFlightRef.current) return;
        void syncContentGenDraftPreviewOnly(userId, pullSessionId);
      }, 220);
    },
    [userId]
  );

  const flushMutatingToolSessionPull = useCallback(
    async (pullSessionId: string): Promise<string | null> => {
      const tool = pendingMutatingToolRef.current;
      pendingMutatingToolRef.current = null;
      if (!tool || !userId) return null;

      await applyMutatingToolSessionPull({
        userId,
        sessionId: pullSessionId,
        toolName: tool,
        assistantMessageId: pendingReviewAssistantIdRef.current,
        pathname,
        resumeId: (() => {
          const row = getRegistryRow(pullSessionId);
          const fromRegistry = row?.feature === "resume" ? (row.feature_id ?? "").trim() : "";
          return fromRegistry || resolveResumeIdForSessionPull();
        })(),
        portfolioId: getCurrentPortfolioId(),
        linkedInSnapshot,
        queryClient,
        baselines: {
          resume: pendingPrePullBaselineRef.current,
          portfolio: pendingPortfolioPrePullBaselineRef.current,
          linkedIn: pendingLinkedInPrePullBaselineRef.current,
        },
      });
      clearMutatingPullBaselines();
      pendingReviewAssistantIdRef.current = null;
      return tool;
    },
    [userId, pathname, resolveResumeIdForSessionPull, getCurrentPortfolioId, linkedInSnapshot, queryClient, clearMutatingPullBaselines]
  );

  const streamExtras = useMemo(
    () => ({
      onMutatingToolResponse: (toolName: string, aiMessageId: string) => {
        const pullSessionId = pendingPullSessionIdRef.current ?? sessionId;
        if (pullSessionId) {
          noteSessionMutatingTool(pullSessionId, toolName);
        }
        if (isMutatingResumeTool(toolName)) {
          const id = resolveResumeIdForSessionPull();
          if (id) {
            const cur = useResumeStore.getState().getResumeData(id);
            if (cur && !pendingPrePullBaselineRef.current) {
              pendingPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as ResumeData;
            }
          }
          noteMutatingToolDuringStream(toolName, aiMessageId);
          return;
        }
        const activePortfolioId = getCurrentPortfolioId();
        if (isMutatingPortfolioTool(toolName)) {
          // Always schedule a session pull for portfolio mutators — even when the local
          // portfolio id is temporarily unknown. ADK writes current_portfolio + portfolio_data;
          // applyPortfolioState resolves the id from session state on GET.
          if (activePortfolioId) {
            const cur = usePortfolioStore.getState().getPortfolioData(activePortfolioId);
            if (cur && !pendingPortfolioPrePullBaselineRef.current) {
              pendingPortfolioPrePullBaselineRef.current = JSON.parse(JSON.stringify(cur)) as PortfolioData;
            }
          }
          noteMutatingToolDuringStream(toolName, aiMessageId);
          return;
        }
        if (isMutatingLinkedInTool(toolName) && isLinkedInRoute) {
          const snapshot = linkedInSnapshot ?? queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
          if (snapshot && !pendingLinkedInPrePullBaselineRef.current) {
            pendingLinkedInPrePullBaselineRef.current = JSON.parse(
              JSON.stringify(mapSnapshotToLinkedInSessionProfile(snapshot))
            ) as LinkedInSessionProfile;
          }
          noteMutatingToolDuringStream(toolName, aiMessageId);
          return;
        }
        if (isMutatingContentGenTool(toolName) || isMutatingApplicationAssetTool(toolName)) {
          noteMutatingToolDuringStream(toolName, aiMessageId);
          if (toSnakeToolKey(toolName) === "update_post_draft" && streamInFlightRef.current) {
            const pullSessionId = pendingPullSessionIdRef.current ?? sessionId;
            scheduleContentGenPreviewPull(pullSessionId);
          }
        }
      },
      onStreamActivityHint: ({ label }: { label: string }) => {
        const trimmed = label.trim();
        if (trimmed) {
          streamHeartbeatRef.current?.markRealHint();
          activityPresenterRef.current?.enqueue(trimmed);
        }
      },
      onNavigationSuggestion: (assistantId: string, navigation: { path: string; label: string }) => {
        streamHadSidebarContentRef.current = true;
        onNavigationSuggestion?.(assistantId, navigation);
      },
      onJobCardsSuggestion: (assistantId: string, payload: import("../parse-unimad-job-cards").UnimadJobCardsPayload) => {
        streamHadSidebarContentRef.current = true;
        onJobCardsSuggestion?.(assistantId, payload);
      },
      onLinkedInSuggestions: (
        assistantId: string,
        payload: import("../parse-unimad-linkedin-suggestions").UnimadLinkedInSuggestionsPayload
      ) => {
        streamHadSidebarContentRef.current = true;
        onLinkedInSuggestions?.(assistantId, payload);
      },
      onAssetCreated: ({ kind }: { kind: "resume" | "portfolio" | "studio" | "linkedin" }) => {
        // React Query: active observers (e.g. resume landing) refetch immediately;
        // inactive routes stay stale until the next visit — no full page reload.
        if (kind === "resume") {
          void queryClient.invalidateQueries({ queryKey: resumesListQueryKey });
        }
      },
    }),
    [
      noteMutatingToolDuringStream,
      scheduleContentGenPreviewPull,
      sessionId,
      resolveResumeIdForSessionPull,
      getCurrentPortfolioId,
      isLinkedInRoute,
      linkedInSnapshot,
      queryClient,
      onNavigationSuggestion,
      onJobCardsSuggestion,
      onLinkedInSuggestions,
    ]
  );

  const submitMessage = useCallback(
    async (
      message: string,
      options?: { aiMessageId?: string; sessionIdOverride?: string; patchResumeId?: string }
    ): Promise<{ hadAssistantText: boolean }> => {
      const targetSessionId = options?.sessionIdOverride?.trim() || sessionId;
      if (!message.trim() || !userId || !targetSessionId) {
        throw new Error("Message, userId, and sessionId are required");
      }

      const rateLimit = checkAdkRequestRateLimit(userId);
      if (!rateLimit.allowed) {
        throw new Error(`${ADK_REQUEST_RATE_LIMIT_MESSAGE} (${rateLimit.retryAfterSeconds}s)`);
      }

      pendingReviewAssistantIdRef.current = options?.aiMessageId ?? null;
      streamHadSidebarContentRef.current = false;

      const assistantId = options?.aiMessageId?.trim() || null;
      const seedRow = getRegistryRow(targetSessionId);
      const seedScope = seedRow ? deriveScopeFromRegistryRow(seedRow) : null;
      const seedLabel =
        seedScope?.domain === "resume" && seedScope.section === "summary"
          ? "Shaping your professional summary…"
          : seedScope?.domain === "content_gen"
            ? (resolveContentGenActivityLabelHint(message) ?? "Working with Unibot…")
            : "Working with Unibot…";

      if (optimisticActivityStartedRef.current) {
        optimisticActivityStartedRef.current = false;
        if (assistantId) {
          attachOptimisticAssistantMessage(assistantId);
          pendingReviewAssistantIdRef.current = assistantId;
          activityPresenterRef.current?.setAssistantMessageId(assistantId);
        }
      } else {
        activityPresenterRef.current?.reset();
        activityPresenterRef.current?.setAssistantMessageId(assistantId);
        setIsSubmitInFlight(true);
        setIsSyncingContext(true);
        setStreamActivityLabel(SYNCING_CONTEXT_LABEL);
        setStreamActivitySnapshot({
          activityLabel: SYNCING_CONTEXT_LABEL,
          assistantMessageId: assistantId,
          submitInFlight: true,
        });
        dispatchStreamActivity({
          loading: true,
          activityLabel: SYNCING_CONTEXT_LABEL,
          assistantMessageId: assistantId,
        });
      }

      setIsSubmitInFlight(true);
      setIsSyncingContext(true);

      let hadAssistantText = false;
      let streamAdkAppName: string | undefined;
      const submitStartedAt = Date.now();
      try {
        try {
          const sessionRow = options?.sessionIdOverride ? getRegistryRow(targetSessionId) : undefined;
          const scopeOverride = sessionRow ? deriveScopeFromRegistryRow(sessionRow) : null;
          captureResumeBaselineBeforeMutatingPull(scopeOverride);
          const patchResult = await patchSessionContextBeforeSend(targetSessionId, scopeOverride, options?.patchResumeId, message.trim());
          if (!patchResult.success) {
            throw new Error(patchResult.error ?? "Could not sync your editor context with Unibot.");
          }
          streamAdkAppName = patchResult.effectiveAppName ?? resolveAdkSessionOptionsForSessionId(targetSessionId).appName;
        } finally {
          setIsSyncingContext(false);
          activityPresenterRef.current?.enqueue(seedLabel);
        }

        pendingPullSessionIdRef.current =
          options?.sessionIdOverride && options.sessionIdOverride.trim() !== sessionId ? options.sessionIdOverride.trim() : null;

        if (isAdkActivityTraceEnabled()) {
          console.info(`[adk-activity] session PATCH done +${Date.now() - submitStartedAt}ms before fetch`);
        }

        streamInFlightRef.current = true;
        streamHeartbeatRef.current?.start(resolveStreamHeartbeatLabels(seedScope, pathname, searchParams?.get("type")));

        hadAssistantText = await startStream(
          {
            message: message.trim(),
            userId,
            sessionId: targetSessionId,
            aiMessageId: options?.aiMessageId,
            adkAppName: streamAdkAppName,
          },
          handleMessageUpdate,
          onEventUpdate,
          onWebsiteCountUpdate,
          streamExtras
        );

        // Pull session only after /run_sse completes — ADK may not persist tool state mid-stream.
        const pullSessionId = pendingPullSessionIdRef.current ?? targetSessionId;
        const appliedTool = await flushMutatingToolSessionPull(pullSessionId);
        if (!hadAssistantText && appliedTool && options?.aiMessageId) {
          const completion = completionMessageForMutatingTool(appliedTool);
          if (completion) {
            handleMessageUpdate({
              type: "ai",
              content: completion,
              id: options.aiMessageId,
              timestamp: new Date(),
            });
            hadAssistantText = true;
          }
        }

        if (!hadAssistantText && streamHadSidebarContentRef.current) {
          hadAssistantText = true;
        }

        return { hadAssistantText };
      } finally {
        streamInFlightRef.current = false;
        if (contentGenPreviewPullTimerRef.current) {
          clearTimeout(contentGenPreviewPullTimerRef.current);
          contentGenPreviewPullTimerRef.current = null;
        }
        streamHeartbeatRef.current?.stop();
        pendingPullSessionIdRef.current = null;
        optimisticActivityStartedRef.current = false;
        const finishSubmit = (): void => {
          activityPresenterRef.current?.reset();
          setIsSubmitInFlight(false);
          setIsSyncingContext(false);
          setStreamActivityLabel(null);
          clearStreamActivitySnapshot();
          dispatchStreamActivity({
            loading: false,
            activityLabel: null,
            assistantMessageId: pendingReviewAssistantIdRef.current,
          });
        };
        if (activityPresenterRef.current?.isPacing()) {
          activityPresenterRef.current.finish(finishSubmit);
        } else {
          finishSubmit();
        }
      }
    },
    [
      userId,
      sessionId,
      pathname,
      startStream,
      handleMessageUpdate,
      onEventUpdate,
      onWebsiteCountUpdate,
      patchSessionContextBeforeSend,
      streamExtras,
      flushMutatingToolSessionPull,
      captureResumeBaselineBeforeMutatingPull,
    ]
  );

  return {
    isLoading,
    currentAgent,
    streamActivityLabel,
    isSyncingContext,
    submitMessage,
  };
}
