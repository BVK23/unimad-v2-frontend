"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { formatUnibotStreamError, type FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import {
  loadAcceptSnapshotsFromLocalStorage,
  mergeAcceptSnapshots,
  parseAcceptSnapshotsFromAdkState,
  setAcceptSnapshotsCache,
  getAcceptSnapshotsCache,
} from "@/src/features/adk-chat/accept-snapshots";
import type { ActiveSession } from "@/src/features/adk-chat/actions";
import { loadSessionHistoryAction, pullSessionStateAction, rewindSessionAction } from "@/src/features/adk-chat/actions";
import { agentMessageToChatMessage } from "@/src/features/adk-chat/agent-message-to-chat";
import { applyAdkSessionStateToStores } from "@/src/features/adk-chat/apply-adk-session-state-to-stores";
import { deriveActiveScope, deriveScopeFromRegistryRow, type ContentScope, type ScopeMatch } from "@/src/features/adk-chat/content-scope";
import { backfillMainSessionTitleFromHistory } from "@/src/features/adk-chat/generate-main-session-title";
import { useAdkSession } from "@/src/features/adk-chat/hooks/useAdkSession";
import { useAdkStreamingManager } from "@/src/features/adk-chat/hooks/useAdkStreamingManager";
import { hydrateLoadedTopicMessages } from "@/src/features/adk-chat/hydrate-loaded-topics";
import { mergeSubSessionsIntoMainMessages, sortMainThreadChronologically } from "@/src/features/adk-chat/improve-topic-helpers";
import { pruneRewindSessionMetadata } from "@/src/features/adk-chat/prune-rewind-session-metadata";
import { reconcileStudioContentAfterRewind } from "@/src/features/adk-chat/reconcile-studio-after-rewind";
import {
  filterMessagesExcludingIds,
  mergeLegacyAndSubTopics,
  reconstructLegacyTopicsFromMain,
} from "@/src/features/adk-chat/reconstruct-legacy-topics";
import { resolveDjangoRestoreTarget } from "@/src/features/adk-chat/resolve-django-restore-target";
import { resolveAdkSessionOptionsForSessionId } from "@/src/features/adk-chat/resolve-sub-session-adk-app";
import { revertDjangoContentAfterRewind } from "@/src/features/adk-chat/revert-django-content-after-rewind";
import {
  getReviewDecisionsCache,
  loadReviewDecisionsFromLocalStorage,
  mergeReviewDecisions,
  parseReviewDecisionsFromAdkState,
  setReviewDecisionsCache,
} from "@/src/features/adk-chat/review-decisions";
import { getRegistryRow, getSessionRegistry } from "@/src/features/adk-chat/session-registry";
import { useAdkApplicationAssetReviewStore } from "@/src/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { useAdkContentGenReviewStore } from "@/src/features/adk-chat/stores/useAdkContentGenReviewStore";
import { useAdkLinkedInReviewStore } from "@/src/features/adk-chat/stores/useAdkLinkedInReviewStore";
import { useAdkPortfolioReviewStore } from "@/src/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore } from "@/src/features/adk-chat/stores/useAdkResumeReviewStore";
import type { AgentMessage, ProcessedEvent } from "@/src/features/adk-chat/types";
import { UNIBOT_AGENT_LOADING_EVENT } from "@/src/hooks/useUnibotAgentBusy";
import type { ChatMessage } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { patchChatMessageInTree } from "./patch-chat-message";
import { markEmptyAssistantStreamErrorInTree, resetAssistantTurnForRetryInTree } from "./set-chat-message-stream-error";
import { updateChatMessageInTree } from "./update-chat-message";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Unibot. I can help you craft your story, write content for your portfolio, or give feedback on your resume.",
  timestamp: new Date(),
};

function collectAssistantIds(messages: ChatMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (message.role === "model") {
      ids.add(message.id);
    }
    if (message.isTopic && Array.isArray(message.messages)) {
      for (const nested of message.messages) {
        if (nested.role === "model") {
          ids.add(nested.id);
        }
      }
    }
  }
  return ids;
}

export interface SendMainMessageOptions {
  /** Send in a sub-session after switching and loading its history. */
  targetSessionId?: string;
  /** Improve / section-review handoffs — do not use this message for auto chat title. */
  excludeFromTitleGeneration?: boolean;
  /** Retry the same turn: do not append another user bubble; reuse this assistant placeholder. */
  retryAssistantId?: string;
}

export interface AdkChatContextValue {
  userId: string;
  sessionId: string;
  sessions: ActiveSession[];
  sessionReady: boolean;
  isBootstrappingSession: boolean;
  sessionError: string | null;
  isLoadingHistory: boolean;
  isAgentLoading: boolean;
  isSyncingContext: boolean;
  streamActivityLabel: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMainMessage: (text: string, options?: SendMainMessageOptions) => Promise<{ assistantId: string }>;
  sendTopicMessage: (prompt: string, assistantMessageId: string, options?: { sessionIdOverride?: string }) => Promise<void>;
  refreshSessions: () => Promise<void>;
  handleSessionSwitch: (newSessionId: string) => void;
  handleCreateNewSession: (options?: { kind?: "main" | "sub"; parentSessionId?: string }) => Promise<void>;
  handleDeleteSession: (sessionIdToDelete: string) => Promise<void>;
  /** Set when the latest assistant turn failed (rate limit, stream error). */
  streamError: FormattedUnibotStreamError | null;
  clearStreamError: () => void;
  setStreamError: (error: FormattedUnibotStreamError | null) => void;
  /** Undo a user turn and everything after it in the ADK session. */
  rewindToMessage: (options: {
    invocationId: string;
    previewText: string;
    revertEditorState: boolean;
    targetSessionId?: string;
    topicId?: string;
    targetScope?: ContentScope;
    scopeMatch?: ScopeMatch;
  }) => Promise<void>;
  isRewinding: boolean;
}

const AdkChatContext = createContext<AdkChatContextValue | null>(null);

export function AdkChatProvider({ userId, children }: { userId: string; children: React.ReactNode }): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [streamError, setStreamError] = useState<FormattedUnibotStreamError | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const clearStreamError = useCallback(() => setStreamError(null), []);
  const pendingSendRef = useRef<{
    targetSessionId: string;
    text: string;
    excludeFromTitleGeneration?: boolean;
  } | null>(null);

  const deriveCurrentActiveScope = useCallback(
    (targetSessionId: string, sessionKind: "main" | "sub" = "main") =>
      deriveActiveScope({
        pathname,
        searchParams,
        sessionId: targetSessionId,
        sessionKind,
      }),
    [pathname, searchParams]
  );

  const {
    sessionId,
    sessions,
    isBootstrappingSession,
    sessionError,
    refreshSessions,
    handleSessionSwitch,
    handleCreateNewSession,
    handleDeleteSession,
  } = useAdkSession(userId);

  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const onMessageUpdate = useCallback((am: AgentMessage) => {
    setMessages(prev => updateChatMessageInTree(prev, am.id, am.content));
  }, []);

  const onEventUpdate = useCallback((_messageId: string, _event: ProcessedEvent) => {
    /* timeline UI deferred */
  }, []);

  const onWebsiteCountUpdate = useCallback((_count: number) => {
    /* research counter deferred */
  }, []);

  const markIncompleteAssistantTurn = useCallback((assistantId: string, err?: unknown) => {
    const hasResumeReview = useAdkResumeReviewStore.getState().reviewStack.some(card => card.assistantMessageId === assistantId);
    const hasPortfolioReview = useAdkPortfolioReviewStore.getState().reviewStack.some(card => card.assistantMessageId === assistantId);
    const hasLinkedInReview = useAdkLinkedInReviewStore.getState().reviewStack.some(card => card.assistantMessageId === assistantId);
    if (hasResumeReview || hasPortfolioReview || hasLinkedInReview) {
      return;
    }

    setMessages(prev => {
      const assistantMsg =
        prev.find(m => m.id === assistantId && m.role === "model") ??
        prev.flatMap(m => m.messages ?? []).find(m => m.id === assistantId && m.role === "model");
      if (!assistantMsg || assistantMsg.text.trim().length > 0 || assistantMsg.isError) {
        return prev;
      }
      if (assistantMsg.unimadJobCards?.jobs?.length || assistantMsg.unimadNavigation || assistantMsg.unimadLinkedInSuggestions) {
        return prev;
      }

      const formatted = formatUnibotStreamError(err ?? new Error("Stream ended without response"), {
        source: "markIncompleteAssistantTurn",
        assistantId,
      });
      const { list, marked } = markEmptyAssistantStreamErrorInTree(prev, assistantId, formatted);
      if (marked) {
        queueMicrotask(() => setStreamError(formatted));
      }
      return list;
    });
  }, []);

  const onNavigationSuggestion = useCallback((assistantId: string, navigation: { path: string; label: string }) => {
    setMessages(prev => patchChatMessageInTree(prev, assistantId, { unimadNavigation: navigation }));
  }, []);

  const onJobCardsSuggestion = useCallback(
    (assistantId: string, payload: import("@/src/features/adk-chat/parse-unimad-job-cards").UnimadJobCardsPayload) => {
      setMessages(prev => patchChatMessageInTree(prev, assistantId, { unimadJobCards: payload }));
    },
    []
  );

  const onLinkedInSuggestions = useCallback(
    (
      assistantId: string,
      payload: import("@/src/features/adk-chat/parse-unimad-linkedin-suggestions").UnimadLinkedInSuggestionsPayload
    ) => {
      setMessages(prev => patchChatMessageInTree(prev, assistantId, { unimadLinkedInSuggestions: payload }));
    },
    []
  );

  const {
    isLoading: isAgentLoading,
    isSyncingContext,
    streamActivityLabel,
    submitMessage,
  } = useAdkStreamingManager({
    userId,
    sessionId,
    onMessageUpdate,
    onEventUpdate,
    onWebsiteCountUpdate,
    onNavigationSuggestion,
    onJobCardsSuggestion,
    onLinkedInSuggestions,
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(UNIBOT_AGENT_LOADING_EVENT, { detail: { loading: isAgentLoading } }));
  }, [isAgentLoading]);

  useEffect(() => {
    useAdkResumeReviewStore.getState().clearAllReviews();
    useAdkPortfolioReviewStore.getState().clearAllReviews();
    useAdkLinkedInReviewStore.getState().clearAllReviews();
    useAdkContentGenReviewStore.getState().clearAllReviews();
    useAdkApplicationAssetReviewStore.getState().clearAllReviews();
  }, [sessionId, userId]);

  useEffect(() => {
    if (!userId || !sessionId) return;

    const loadSessionId = sessionId;
    let cancelled = false;
    setMessages([WELCOME_MESSAGE]);
    setStreamError(null);
    setIsLoadingHistory(true);

    const refreshIfStillActive = (): void | Promise<void> => {
      if (cancelled || sessionIdRef.current !== loadSessionId) return;
      return refreshSessions();
    };

    void (async () => {
      try {
        const meta = getRegistryRow(sessionId);
        const isSubSession = meta?.kind === "sub";
        const mainSessionIdForLoad = isSubSession && meta?.parent_adk_session_id ? meta.parent_adk_session_id : sessionId;
        const historySessionId = isSubSession ? sessionId : mainSessionIdForLoad;

        const pullResult = await pullSessionStateAction(userId, mainSessionIdForLoad);
        if (!cancelled && pullResult.success) {
          const adkDecisions = parseReviewDecisionsFromAdkState(pullResult.state);
          const localDecisions = loadReviewDecisionsFromLocalStorage(userId, mainSessionIdForLoad);
          setReviewDecisionsCache(userId, mainSessionIdForLoad, mergeReviewDecisions(adkDecisions, localDecisions));
          const adkSnapshots = parseAcceptSnapshotsFromAdkState(pullResult.state);
          const localSnapshots = loadAcceptSnapshotsFromLocalStorage(userId, mainSessionIdForLoad);
          setAcceptSnapshotsCache(userId, mainSessionIdForLoad, mergeAcceptSnapshots(adkSnapshots, localSnapshots));
        }

        const historySessionOptions = isSubSession && meta ? resolveAdkSessionOptionsForSessionId(historySessionId) : undefined;

        const result = await loadSessionHistoryAction(userId, historySessionId, historySessionOptions);
        if (cancelled) return;

        if (result.success) {
          const mapped = result.messages.map(m => agentMessageToChatMessage(m));
          const scopedMapped = mapped.map(message => {
            if (message.role !== "user") return message;
            if (isSubSession && meta) {
              return { ...message, contentScope: deriveScopeFromRegistryRow(meta) };
            }
            return { ...message, contentScope: deriveCurrentActiveScope(mainSessionIdForLoad) };
          });
          let mainMessages = scopedMapped.length > 0 ? scopedMapped : [WELCOME_MESSAGE];

          if (!isSubSession) {
            const registry = getSessionRegistry();
            const legacy = reconstructLegacyTopicsFromMain(mainMessages, registry);
            mainMessages = filterMessagesExcludingIds(mainMessages, legacy.excludedMessageIds);
            mainMessages = await mergeSubSessionsIntoMainMessages(userId, sessionId, mainMessages);
            const subTopics = mainMessages.filter(m => m.isTopic && m.subSessionAdkId);
            const nonTopicMain = mainMessages.filter(m => !m.isTopic || !m.subSessionAdkId);
            const mergedTopics = mergeLegacyAndSubTopics(subTopics, legacy.topics);
            mainMessages = sortMainThreadChronologically([...nonTopicMain, ...mergedTopics]);
            mainMessages = hydrateLoadedTopicMessages(mainMessages);

            if (result.messages.length > 0) {
              void backfillMainSessionTitleFromHistory(loadSessionId, result.messages, refreshIfStillActive, userId);
            }

            if (pathname.startsWith("/uniboard/studio")) {
              void applyAdkSessionStateToStores(userId, mainSessionIdForLoad, pathname, queryClient);
            }
          }

          if (!cancelled) {
            setMessages(mainMessages);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deriveCurrentActiveScope, userId, sessionId, refreshSessions, pathname, queryClient]);

  const sendMainMessageNow = useCallback(
    async (text: string, activeSessionId: string, options?: SendMainMessageOptions): Promise<{ assistantId: string }> => {
      if (!userId || !activeSessionId) {
        throw new Error("Session not ready");
      }

      const retryAssistantId = options?.retryAssistantId?.trim();
      const assistantId =
        retryAssistantId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}`);

      if (retryAssistantId) {
        setMessages(prev => resetAssistantTurnForRetryInTree(prev, assistantId));
      } else {
        const userMsgId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const userChat: ChatMessage = {
          id: userMsgId,
          role: "user",
          text,
          timestamp: new Date(),
          excludeFromTitleGeneration: options?.excludeFromTitleGeneration,
          contentScope: deriveCurrentActiveScope(activeSessionId),
        };
        const assistantChat: ChatMessage = {
          id: assistantId,
          role: "model",
          text: "",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userChat, assistantChat]);
      }

      try {
        const { hadAssistantText } = await submitMessage(text, { aiMessageId: assistantId });
        if (!hadAssistantText) {
          queueMicrotask(() => markIncompleteAssistantTurn(assistantId));
        }
        return { assistantId };
      } catch (error) {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        Object.defineProperty(wrapped, "assistantMessageId", { value: assistantId, enumerable: true });
        throw wrapped;
      }
    },
    [userId, submitMessage, markIncompleteAssistantTurn, deriveCurrentActiveScope]
  );

  const sendMainMessage = useCallback(
    async (text: string, options?: SendMainMessageOptions): Promise<{ assistantId: string }> => {
      const targetId = options?.targetSessionId?.trim() || sessionId;
      if (!userId || !targetId) {
        throw new Error("Session not ready");
      }

      if (targetId !== sessionId) {
        pendingSendRef.current = {
          targetSessionId: targetId,
          text,
          excludeFromTitleGeneration: options?.excludeFromTitleGeneration,
        };
        handleSessionSwitch(targetId);
        return { assistantId: "" };
      }

      return sendMainMessageNow(text, targetId, options);
    },
    [userId, sessionId, handleSessionSwitch, sendMainMessageNow]
  );

  useEffect(() => {
    const pending = pendingSendRef.current;
    if (!pending) return;
    if (sessionId !== pending.targetSessionId) return;
    if (isLoadingHistory || isBootstrappingSession) return;

    pendingSendRef.current = null;
    void sendMainMessageNow(pending.text, pending.targetSessionId, {
      excludeFromTitleGeneration: pending.excludeFromTitleGeneration,
    });
  }, [sessionId, isLoadingHistory, isBootstrappingSession, sendMainMessageNow]);

  const sendTopicMessage = useCallback(
    async (prompt: string, assistantMessageId: string, options?: { sessionIdOverride?: string }): Promise<void> => {
      if (!userId || !sessionId) {
        throw new Error("Session not ready");
      }
      try {
        const { hadAssistantText } = await submitMessage(prompt, {
          aiMessageId: assistantMessageId,
          sessionIdOverride: options?.sessionIdOverride,
        });
        if (!hadAssistantText) {
          markIncompleteAssistantTurn(assistantMessageId);
        }
      } catch (error) {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        Object.defineProperty(wrapped, "assistantMessageId", { value: assistantMessageId, enumerable: true });
        throw wrapped;
      }
    },
    [userId, sessionId, submitMessage, markIncompleteAssistantTurn]
  );

  const sessionReady = Boolean(userId && sessionId && !isBootstrappingSession);

  const rewindToMessage = useCallback(
    async (options: {
      invocationId: string;
      previewText: string;
      revertEditorState: boolean;
      targetSessionId?: string;
      topicId?: string;
      targetScope?: ContentScope;
      scopeMatch?: ScopeMatch;
    }): Promise<void> => {
      const targetSessionId = options.targetSessionId?.trim() || sessionId;
      if (!userId || !targetSessionId || !options.invocationId.trim()) {
        throw new Error("Session not ready for rewind");
      }

      setIsRewinding(true);
      try {
        const adkSessionOptions = resolveAdkSessionOptionsForSessionId(targetSessionId);
        const threadMessagesBeforeRewind = options.topicId
          ? (messages.find(message => message.id === options.topicId)?.messages ?? [])
          : messages.filter(message => !message.isTopic);
        const previousAssistantIds = collectAssistantIds(messages);
        const rewindResult = await rewindSessionAction(userId, targetSessionId, options.invocationId, adkSessionOptions);
        if (!rewindResult.success) {
          throw new Error(rewindResult.error ?? "Could not rewind this conversation.");
        }

        const history = await loadSessionHistoryAction(userId, targetSessionId, adkSessionOptions);
        if (!history.success) {
          throw new Error(history.error ?? "Could not reload conversation after rewind.");
        }

        const mapped = history.messages.map(m => agentMessageToChatMessage(m));
        const targetRow = getRegistryRow(targetSessionId);
        const scopedMapped = mapped.map(message => {
          if (message.role !== "user") return message;
          if (targetRow) {
            return { ...message, contentScope: deriveScopeFromRegistryRow(targetRow) };
          }
          return { ...message, contentScope: deriveCurrentActiveScope(targetSessionId) };
        });

        let rewoundThreadMessages: ChatMessage[] = [];
        let remainingMainMessages: ChatMessage[] = [];

        let nextAssistantIds = new Set<string>();
        if (options.topicId) {
          setMessages(prev =>
            prev.map(topic =>
              topic.id === options.topicId
                ? {
                    ...topic,
                    messages: scopedMapped,
                  }
                : topic
            )
          );
          rewoundThreadMessages = scopedMapped;
          nextAssistantIds = collectAssistantIds(scopedMapped);
        } else {
          let mainMessages = scopedMapped.length > 0 ? scopedMapped : [WELCOME_MESSAGE];
          const meta = getRegistryRow(targetSessionId);
          if (meta?.kind !== "sub") {
            const registry = getSessionRegistry();
            const legacy = reconstructLegacyTopicsFromMain(mainMessages, registry);
            mainMessages = filterMessagesExcludingIds(mainMessages, legacy.excludedMessageIds);
            mainMessages = await mergeSubSessionsIntoMainMessages(userId, targetSessionId, mainMessages);
            const subTopics = mainMessages.filter(m => m.isTopic && m.subSessionAdkId);
            const nonTopicMain = mainMessages.filter(m => !m.isTopic || !m.subSessionAdkId);
            const mergedTopics = mergeLegacyAndSubTopics(subTopics, legacy.topics);
            mainMessages = sortMainThreadChronologically([...nonTopicMain, ...mergedTopics]);
            mainMessages = hydrateLoadedTopicMessages(mainMessages);
          }
          remainingMainMessages = mainMessages;
          setMessages(mainMessages);
          nextAssistantIds = collectAssistantIds(mainMessages);
        }

        const removedAssistantIds = new Set<string>();
        previousAssistantIds.forEach(id => {
          if (!nextAssistantIds.has(id)) {
            removedAssistantIds.add(id);
          }
        });

        const targetScope = options.targetScope ?? (targetRow ? deriveScopeFromRegistryRow(targetRow) : null);
        const reviewMainSessionId = targetRow?.parent_adk_session_id?.trim() || sessionId;
        const remainingMessages = options.topicId ? rewoundThreadMessages : remainingMainMessages.filter(message => !message.isTopic);
        const shouldRevertDjango =
          options.revertEditorState && options.scopeMatch === "full" && targetScope && removedAssistantIds.size > 0;

        if (shouldRevertDjango) {
          const restoreTarget = resolveDjangoRestoreTarget({
            threadMessagesBeforeRewind,
            remainingMessages,
            removedAssistantIds,
            acceptSnapshots: getAcceptSnapshotsCache(userId, reviewMainSessionId),
            reviewDecisions: getReviewDecisionsCache(userId, reviewMainSessionId),
            targetScope,
            topicId: options.topicId,
          });
          if (restoreTarget) {
            await revertDjangoContentAfterRewind({
              target: restoreTarget,
              userId,
              mainSessionId: reviewMainSessionId,
              queryClient,
            });
          }
        }

        if (options.revertEditorState) {
          useAdkResumeReviewStore.getState().clearAllReviews();
          useAdkPortfolioReviewStore.getState().clearAllReviews();
          useAdkLinkedInReviewStore.getState().clearAllReviews();
          useAdkContentGenReviewStore.getState().clearAllReviews();
          useAdkApplicationAssetReviewStore.getState().clearAllReviews();
          if (removedAssistantIds.size > 0) {
            await pruneRewindSessionMetadata(userId, reviewMainSessionId, removedAssistantIds);
          }
          const hydrateSessionId =
            shouldRevertDjango &&
            targetScope &&
            (targetScope.domain === "application_asset" ||
              targetScope.domain === "content_gen" ||
              targetScope.domain === "resume" ||
              targetScope.domain === "portfolio" ||
              targetScope.domain === "linkedin")
              ? reviewMainSessionId
              : targetSessionId;
          await applyAdkSessionStateToStores(userId, hydrateSessionId, pathname, queryClient, {
            targetScope: options.targetScope ?? null,
            forceStudioHydrate: true,
            afterRewind: true,
          });

          if (rewoundThreadMessages.length > 0 && (targetScope?.domain === "application_asset" || targetScope?.domain === "content_gen")) {
            reconcileStudioContentAfterRewind({
              threadMessages: rewoundThreadMessages,
              targetScope,
              userId,
              reviewMainSessionId,
              pathname,
            });
          }
        } else {
          useAdkResumeReviewStore.getState().clearReviewsByAssistantIds(removedAssistantIds);
          useAdkPortfolioReviewStore.getState().clearReviewsByAssistantIds(removedAssistantIds);
          useAdkLinkedInReviewStore.getState().clearReviewsByAssistantIds(removedAssistantIds);
          useAdkContentGenReviewStore.getState().clearReviewsByAssistantIds(removedAssistantIds);
          useAdkApplicationAssetReviewStore.getState().clearReviewsByAssistantIds(removedAssistantIds);
          if (removedAssistantIds.size > 0) {
            await pruneRewindSessionMetadata(userId, reviewMainSessionId, removedAssistantIds);
          }
        }

        clearStreamError();
      } finally {
        setIsRewinding(false);
      }
    },
    [messages, userId, sessionId, pathname, queryClient, clearStreamError, deriveCurrentActiveScope]
  );

  const value = useMemo(
    (): AdkChatContextValue => ({
      userId,
      sessionId,
      sessions,
      sessionReady,
      isBootstrappingSession,
      sessionError,
      isLoadingHistory,
      isAgentLoading,
      isSyncingContext,
      streamActivityLabel,
      messages,
      setMessages,
      sendMainMessage,
      sendTopicMessage,
      refreshSessions,
      handleSessionSwitch,
      handleCreateNewSession,
      handleDeleteSession,
      streamError,
      clearStreamError,
      setStreamError,
      rewindToMessage,
      isRewinding,
    }),
    [
      userId,
      sessionId,
      sessions,
      sessionReady,
      isBootstrappingSession,
      sessionError,
      isLoadingHistory,
      isAgentLoading,
      isSyncingContext,
      streamActivityLabel,
      messages,
      sendMainMessage,
      sendTopicMessage,
      refreshSessions,
      handleSessionSwitch,
      handleCreateNewSession,
      handleDeleteSession,
      streamError,
      clearStreamError,
      rewindToMessage,
      isRewinding,
    ]
  );

  return <AdkChatContext.Provider value={value}>{children}</AdkChatContext.Provider>;
}

export function useAdkChatContext(): AdkChatContextValue {
  const ctx = useContext(AdkChatContext);
  if (!ctx) {
    throw new Error("useAdkChatContext must be used within AdkChatProvider");
  }
  return ctx;
}

/** Same as useAdkChatContext but returns null outside the provider (e.g. legacy App.tsx studio tab). */
export function useOptionalAdkChatContext(): AdkChatContextValue | null {
  return useContext(AdkChatContext);
}
