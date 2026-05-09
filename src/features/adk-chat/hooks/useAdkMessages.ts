"use client";

import { useState, useCallback } from "react";
import type { AgentMessage, ProcessedEvent } from "../types";

export interface UseAdkMessagesReturn {
  messages: AgentMessage[];
  messageEvents: Map<string, ProcessedEvent[]>;
  websiteCount: number;
  addMessage: (message: AgentMessage) => void;
  updateMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  setMessages: (messages: AgentMessage[] | ((prev: AgentMessage[]) => AgentMessage[])) => void;
  setMessageEvents: (
    events: Map<string, ProcessedEvent[]> | ((prev: Map<string, ProcessedEvent[]>) => Map<string, ProcessedEvent[]>)
  ) => void;
  updateWebsiteCount: (count: number) => void;
}

export function useAdkMessages(): UseAdkMessagesReturn {
  const [messages, setMessagesState] = useState<AgentMessage[]>([]);
  const [messageEvents, setMessageEventsState] = useState<Map<string, ProcessedEvent[]>>(new Map());
  const [websiteCount, setWebsiteCount] = useState(0);

  const addMessage = useCallback((message: AgentMessage): void => {
    setMessagesState(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, content: string): void => {
    setMessagesState(prev => prev.map(msg => (msg.id === messageId ? { ...msg, content } : msg)));
  }, []);

  const clearMessages = useCallback((): void => {
    setMessagesState([]);
  }, []);

  const setMessages = useCallback((messagesOrUpdater: AgentMessage[] | ((prev: AgentMessage[]) => AgentMessage[])): void => {
    setMessagesState(messagesOrUpdater);
  }, []);

  const setMessageEvents = useCallback(
    (eventsOrUpdater: Map<string, ProcessedEvent[]> | ((prev: Map<string, ProcessedEvent[]>) => Map<string, ProcessedEvent[]>)): void => {
      setMessageEventsState(eventsOrUpdater);
    },
    []
  );

  const updateWebsiteCount = useCallback((count: number): void => {
    setWebsiteCount(prev => Math.max(prev, count));
  }, []);

  return {
    messages,
    messageEvents,
    websiteCount,
    addMessage,
    updateMessage,
    clearMessages,
    setMessages,
    setMessageEvents,
    updateWebsiteCount,
  };
}
