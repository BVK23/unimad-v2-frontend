"use client";

import { useState, useCallback, useRef } from "react";
import { ADK_CHAT_STREAM_ENDPOINT, StreamingConnectionManager } from "../streaming/connection-manager";
import { getEventTitle } from "../streaming/stream-utils";
import type { StreamProcessingCallbacks, StreamingAPIPayload } from "../streaming/types";
import type { AgentMessage, ProcessedEvent } from "../types";

export interface UseAdkStreamingReturn {
  isLoading: boolean;
  currentAgent: string;
  startStream: (
    apiPayload: {
      message: string;
      userId: string;
      sessionId: string;
      aiMessageId?: string;
      adkAppName?: string;
    },
    onMessageUpdate: (message: AgentMessage) => void,
    onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
    onWebsiteCountUpdate: (count: number) => void,
    streamExtras?: Pick<
      StreamProcessingCallbacks,
      | "onMutatingToolResponse"
      | "onStreamActivityHint"
      | "onNavigationSuggestion"
      | "onJobCardsSuggestion"
      | "onLinkedInSuggestions"
      | "onAssetCreated"
    >
  ) => Promise<boolean>;
  getEventTitle: (agentName: string) => string;
}

export function useAdkStreaming(retryFn: <T>(fn: () => Promise<T>) => Promise<T>): UseAdkStreamingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("");

  const accumulatedTextRef = useRef("");
  const intermediateNarrationRef = useRef("");
  const currentAgentRef = useRef("");

  const connectionManager = useRef<StreamingConnectionManager | null>(null);

  if (connectionManager.current === null) {
    connectionManager.current = new StreamingConnectionManager({
      retryFn,
      endpoint: ADK_CHAT_STREAM_ENDPOINT,
    });
  }

  const startStream = useCallback(
    async (
      apiPayload: {
        message: string;
        userId: string;
        sessionId: string;
        aiMessageId?: string;
        adkAppName?: string;
      },
      onMessageUpdate: (message: AgentMessage) => void,
      onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
      onWebsiteCountUpdate: (count: number) => void,
      streamExtras?: Pick<
        StreamProcessingCallbacks,
        | "onMutatingToolResponse"
        | "onStreamActivityHint"
        | "onNavigationSuggestion"
        | "onJobCardsSuggestion"
        | "onLinkedInSuggestions"
        | "onAssetCreated"
      >
    ): Promise<boolean> => {
      if (!connectionManager.current) {
        throw new Error("Connection manager not initialized");
      }

      const aiMessageId =
        apiPayload.aiMessageId ??
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);

      const callbacks: StreamProcessingCallbacks = {
        onMessageUpdate,
        onEventUpdate,
        onWebsiteCountUpdate,
        ...streamExtras,
      };

      const streamingPayload: StreamingAPIPayload = {
        message: apiPayload.message,
        userId: apiPayload.userId,
        sessionId: apiPayload.sessionId,
        adkAppName: apiPayload.adkAppName,
      };

      return connectionManager.current.submitMessage(
        streamingPayload,
        callbacks,
        accumulatedTextRef,
        currentAgentRef,
        setCurrentAgent,
        setIsLoading,
        aiMessageId,
        intermediateNarrationRef
      );
    },
    []
  );

  const getEventTitleCallback = useCallback((agentName: string): string => {
    return getEventTitle(agentName);
  }, []);

  return {
    isLoading,
    currentAgent,
    startStream,
    getEventTitle: getEventTitleCallback,
  };
}
