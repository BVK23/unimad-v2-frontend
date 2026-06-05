"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { formatUnibotStreamError, type FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import type { ActiveSession } from "@/src/features/adk-chat/actions";
import { loadSessionHistoryAction, rewindSessionAction } from "@/src/features/adk-chat/actions";
import { applyAdkSessionStateToStores } from "@/src/features/adk-chat/apply-adk-session-state-to-stores";
import { useAdkSession } from "@/src/features/adk-chat/hooks/useAdkSession";
import { useAdkStreamingManager } from "@/src/features/adk-chat/hooks/useAdkStreamingManager";
import { mergeSubSessionsIntoMainMessages } from "@/src/features/adk-chat/improve-topic-helpers";
import { getRegistryRow } from "@/src/features/adk-chat/session-registry";
import { useAdkApplicationAssetReviewStore } from "@/src/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { useAdkContentGenReviewStore } from "@/src/features/adk-chat/stores/useAdkContentGenReviewStore";
import { useAdkPortfolioReviewStore } from "@/src/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore } from "@/src/features/adk-chat/stores/useAdkResumeReviewStore";
import type { AgentMessage, ProcessedEvent } from "@/src/features/adk-chat/types";
import type { ChatMessage } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { markEmptyAssistantStreamErrorInTree, resetAssistantTurnForRetryInTree } from "./set-chat-message-stream-error";
import { updateChatMessageInTree } from "./update-chat-message";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Unibot. I can help you craft your story, write content for your portfolio, or give feedback on your resume.",
  timestamp: new Date(),
};

function parseAgentTimestamp(ts: Date | string | number): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

function agentMessageToChatMessage(m: AgentMessage): ChatMessage {
  return {
    id: m.id,
    role: m.type === "human" ? "user" : "model",
    text: m.content,
    timestamp: parseAgentTimestamp(m.timestamp as unknown as Date | string | number),
    ...(m.invocationId ? { invocationId: m.invocationId } : {}),
  };
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
  }) => Promise<void>;
  isRewinding: boolean;
}

const AdkChatContext = createContext<AdkChatContextValue | null>(null);

export function AdkChatProvider({ userId, children }: { userId: string; children: React.ReactNode }): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [streamError, setStreamError] = useState<FormattedUnibotStreamError | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const clearStreamError = useCallback(() => setStreamError(null), []);
  const pendingSendRef = useRef<{
    targetSessionId: string;
    text: string;
    excludeFromTitleGeneration?: boolean;
  } | null>(null);

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
    if (hasResumeReview || hasPortfolioReview) {
      return;
    }

    setMessages(prev => {
      const assistantMsg =
        prev.find(m => m.id === assistantId && m.role === "model") ??
        prev.flatMap(m => m.messages ?? []).find(m => m.id === assistantId && m.role === "model");
      if (!assistantMsg || assistantMsg.text.trim().length > 0 || assistantMsg.isError) {
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

  const {
    isLoading: isAgentLoading,
    streamActivityLabel,
    submitMessage,
  } = useAdkStreamingManager({
    userId,
    sessionId,
    onMessageUpdate,
    onEventUpdate,
    onWebsiteCountUpdate,
  });

  useEffect(() => {
    useAdkResumeReviewStore.getState().clearAllReviews();
    useAdkPortfolioReviewStore.getState().clearAllReviews();
  }, [sessionId, userId]);

  useEffect(() => {
    if (!userId || !sessionId) return;

    let cancelled = false;
    setMessages([WELCOME_MESSAGE]);
    setStreamError(null);
    setIsLoadingHistory(true);

    void (async () => {
      try {
        const result = await loadSessionHistoryAction(userId, sessionId);
        if (cancelled) return;

        if (result.success) {
          const mapped = result.messages.map(m =>
            agentMessageToChatMessage({
              ...m,
              timestamp: parseAgentTimestamp(m.timestamp as unknown as Date | string | number),
            })
          );
          let mainMessages = mapped.length > 0 ? mapped : [WELCOME_MESSAGE];
          const meta = getRegistryRow(sessionId);
          const isSubSession = meta?.kind === "sub";
          if (!isSubSession) {
            mainMessages = await mergeSubSessionsIntoMainMessages(userId, sessionId, mainMessages);
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
  }, [userId, sessionId]);

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
        await submitMessage(text, { aiMessageId: assistantId });
        markIncompleteAssistantTurn(assistantId);
        return { assistantId };
      } catch (error) {
        const wrapped = error instanceof Error ? error : new Error(String(error));
        Object.defineProperty(wrapped, "assistantMessageId", { value: assistantId, enumerable: true });
        throw wrapped;
      }
    },
    [userId, submitMessage, markIncompleteAssistantTurn]
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
        await submitMessage(prompt, {
          aiMessageId: assistantMessageId,
          sessionIdOverride: options?.sessionIdOverride,
        });
        markIncompleteAssistantTurn(assistantMessageId);
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
    }): Promise<void> => {
      const targetSessionId = options.targetSessionId?.trim() || sessionId;
      if (!userId || !targetSessionId || !options.invocationId.trim()) {
        throw new Error("Session not ready for rewind");
      }

      setIsRewinding(true);
      try {
        const rewindResult = await rewindSessionAction(userId, targetSessionId, options.invocationId);
        if (!rewindResult.success) {
          throw new Error(rewindResult.error ?? "Could not rewind this conversation.");
        }

        const history = await loadSessionHistoryAction(userId, targetSessionId);
        if (!history.success) {
          throw new Error(history.error ?? "Could not reload conversation after rewind.");
        }

        const mapped = history.messages.map(m =>
          agentMessageToChatMessage({
            ...m,
            timestamp: parseAgentTimestamp(m.timestamp as unknown as Date | string | number),
          })
        );

        if (options.topicId) {
          setMessages(prev =>
            prev.map(topic =>
              topic.id === options.topicId
                ? {
                    ...topic,
                    messages: mapped,
                  }
                : topic
            )
          );
        } else {
          let mainMessages = mapped.length > 0 ? mapped : [WELCOME_MESSAGE];
          const meta = getRegistryRow(targetSessionId);
          if (meta?.kind !== "sub") {
            mainMessages = await mergeSubSessionsIntoMainMessages(userId, targetSessionId, mainMessages);
          }
          setMessages(mainMessages);
        }

        if (options.revertEditorState) {
          useAdkResumeReviewStore.getState().clearAllReviews();
          useAdkPortfolioReviewStore.getState().clearAllReviews();
          useAdkContentGenReviewStore.getState().clearAllReviews();
          useAdkApplicationAssetReviewStore.getState().clearAllReviews();
          await applyAdkSessionStateToStores(userId, targetSessionId, pathname, queryClient);
        }

        clearStreamError();
      } finally {
        setIsRewinding(false);
      }
    },
    [userId, sessionId, pathname, queryClient, clearStreamError]
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
