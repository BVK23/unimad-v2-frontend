"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ActiveSession } from "@/src/features/adk-chat/actions";
import { loadSessionHistoryAction } from "@/src/features/adk-chat/actions";
import { useAdkSession } from "@/src/features/adk-chat/hooks/useAdkSession";
import { useAdkStreamingManager } from "@/src/features/adk-chat/hooks/useAdkStreamingManager";
import type { AgentMessage, ProcessedEvent } from "@/src/features/adk-chat/types";
import type { ChatMessage } from "@/types";
import { updateChatMessageInTree } from "./update-chat-message";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Unimad AI. I can help you craft your story, write content for your portfolio, or give feedback on your resume.",
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
  };
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
  /** Live hint while the assistant streams (tool/agent activity). */
  streamActivityLabel: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMainMessage: (text: string) => Promise<void>;
  sendTopicMessage: (prompt: string, assistantMessageId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  handleSessionSwitch: (newSessionId: string) => void;
  handleCreateNewSession: () => Promise<void>;
  handleDeleteSession: (sessionIdToDelete: string) => Promise<void>;
}

const AdkChatContext = createContext<AdkChatContextValue | null>(null);

export function AdkChatProvider({ userId, children }: { userId: string; children: React.ReactNode }): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
    if (!userId || !sessionId) return;

    let cancelled = false;
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
          setMessages(mapped.length > 0 ? mapped : [WELCOME_MESSAGE]);
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

  const sendMainMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!userId || !sessionId) {
        throw new Error("Session not ready");
      }

      const userMsgId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const assistantId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}`;

      const userChat: ChatMessage = {
        id: userMsgId,
        role: "user",
        text,
        timestamp: new Date(),
      };
      const assistantChat: ChatMessage = {
        id: assistantId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userChat, assistantChat]);

      await submitMessage(text, { aiMessageId: assistantId });
    },
    [userId, sessionId, submitMessage]
  );

  const sendTopicMessage = useCallback(
    async (prompt: string, assistantMessageId: string): Promise<void> => {
      if (!userId || !sessionId) {
        throw new Error("Session not ready");
      }
      await submitMessage(prompt, { aiMessageId: assistantMessageId });
    },
    [userId, sessionId, submitMessage]
  );

  const sessionReady = Boolean(userId && sessionId && !isBootstrappingSession);

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
