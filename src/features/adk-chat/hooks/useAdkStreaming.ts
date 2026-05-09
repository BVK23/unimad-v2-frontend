"use client";

import { useState, useCallback, useRef } from "react";
import { StreamingConnectionManager } from "../streaming/connection-manager";
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
    },
    onMessageUpdate: (message: AgentMessage) => void,
    onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
    onWebsiteCountUpdate: (count: number) => void,
    streamExtras?: Pick<StreamProcessingCallbacks, "onMutatingToolResponse" | "onStreamActivityHint">
  ) => Promise<void>;
  getEventTitle: (agentName: string) => string;
}

export function useAdkStreaming(retryFn: <T>(fn: () => Promise<T>) => Promise<T>): UseAdkStreamingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("");

  const accumulatedTextRef = useRef("");
  const currentAgentRef = useRef("");

  const connectionManager = useRef<StreamingConnectionManager | null>(null);

  if (connectionManager.current === null) {
    connectionManager.current = new StreamingConnectionManager({
      retryFn,
      endpoint: "/api/run_sse",
    });
  }

  const startStream = useCallback(
    async (
      apiPayload: {
        message: string;
        userId: string;
        sessionId: string;
        aiMessageId?: string;
      },
      onMessageUpdate: (message: AgentMessage) => void,
      onEventUpdate: (messageId: string, event: ProcessedEvent) => void,
      onWebsiteCountUpdate: (count: number) => void,
      streamExtras?: Pick<StreamProcessingCallbacks, "onMutatingToolResponse" | "onStreamActivityHint">
    ): Promise<void> => {
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
      };

      await connectionManager.current.submitMessage(
        streamingPayload,
        callbacks,
        accumulatedTextRef,
        currentAgentRef,
        setCurrentAgent,
        setIsLoading,
        aiMessageId
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
