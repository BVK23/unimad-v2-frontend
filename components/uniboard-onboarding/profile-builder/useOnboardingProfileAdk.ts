"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createSessionAction, pullSessionStateAction, syncSessionStateAction } from "@/features/adk-chat/actions";
import { useAdkStreaming } from "@/features/adk-chat/hooks/useAdkStreaming";
import {
  isMutatingOnboardingTool,
  labelForMutatingToolResponse,
  labelForReadToolResponse,
  labelForToolCall,
  toSnakeToolKey,
} from "@/features/adk-chat/streaming/stream-activity";
import type { AgentMessage, ProcessedEvent } from "@/features/adk-chat/types";
import { getAdkUserId } from "@/src/features/adk-chat/server-actions/get-adk-user-id";
import {
  applyOnboardingProfileFromAdkState,
  buildOnboardingProfileStateDelta,
  ONBOARDING_ADK_APP,
  ONBOARDING_START_MESSAGE,
  type OnboardingAdkContext,
} from "./onboardingAdk";
import { useProfileBuilderStore } from "./useProfileBuilderStore";

export type OnboardingLoadingPhase = "boot" | "reply" | null;

export type OnboardingChatMessage = {
  id: string;
  role: "assistant" | "user" | "status";
  text: string;
  timestamp: Date;
};

async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

export function useOnboardingProfileAdk(context: OnboardingAdkContext) {
  const data = useProfileBuilderStore(s => s.data);

  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<OnboardingChatMessage[]>([]);
  const [streamActivityLabel, setStreamActivityLabel] = useState<string | null>("Waking up Unibot…");
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const { isLoading, startStream } = useAdkStreaming(retryOnce);

  const pullProfileFromSession = useCallback(async (uid: string, sid: string) => {
    const pulled = await pullSessionStateAction(uid, sid, { appName: ONBOARDING_ADK_APP });
    if (!pulled.success || !pulled.state) return;
    const patch = applyOnboardingProfileFromAdkState(pulled.state as Record<string, unknown>);
    if (!patch) return;
    useProfileBuilderStore.setState(state => ({
      data: {
        ...state.data,
        educations: patch.educations ?? state.data.educations,
        experiences: patch.experiences ?? state.data.experiences,
        projects: patch.projects ?? state.data.projects,
        skills: patch.skills ?? state.data.skills,
        experienceSkipped: patch.experienceSkipped ?? state.data.experienceSkipped,
        projectsSkipped: patch.projectsSkipped ?? state.data.projectsSkipped,
      },
    }));
  }, []);

  const patchSession = useCallback(
    async (uid: string, sid: string) => {
      const stateDelta = {
        ...buildOnboardingProfileStateDelta(dataRef.current, context),
        django_username: uid,
      };
      await syncSessionStateAction(uid, sid, stateDelta, { appName: ONBOARDING_ADK_APP });
    },
    [context]
  );

  const appendMessage = useCallback((msg: Omit<OnboardingChatMessage, "id" | "timestamp"> & { id?: string }) => {
    setMessages(prev => [
      ...prev,
      {
        id: msg.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date(),
        role: msg.role,
        text: msg.text,
      },
    ]);
  }, []);

  const runStream = useCallback(
    async (text: string, uid: string, sid: string) => {
      const isStart = text === ONBOARDING_START_MESSAGE;
      setStreamActivityLabel(isStart ? "Waking up Unibot…" : "Reading your answer…");
      const aiMessageId = `ai-${Date.now()}`;
      let accumulated = "";

      const onMessageUpdate = (message: AgentMessage) => {
        accumulated = message.content ?? accumulated;
        setMessages(prev => {
          const rest = prev.filter(m => m.id !== aiMessageId);
          return [
            ...rest,
            {
              id: aiMessageId,
              role: "assistant" as const,
              text: accumulated,
              timestamp: new Date(),
            },
          ];
        });
      };

      const setActivity = (label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        flushSync(() => setStreamActivityLabel(trimmed));
      };

      const onEventUpdate = (_messageId: string, event: ProcessedEvent) => {
        const eventData = event.data as
          | {
              type?: string;
              name?: string;
              args?: Record<string, unknown>;
              response?: Record<string, unknown>;
            }
          | undefined;
        if (!eventData?.type || !eventData.name) return;
        const toolName = toSnakeToolKey(eventData.name);
        if (eventData.type === "functionCall") {
          setActivity(labelForToolCall(eventData.name, eventData.args));
        } else if (eventData.type === "functionResponse") {
          if (isMutatingOnboardingTool(toolName)) {
            setActivity(labelForMutatingToolResponse(eventData.name));
          } else {
            const readLabel = labelForReadToolResponse(eventData.name, eventData.response ?? {});
            if (readLabel) setActivity(readLabel);
          }
        }
      };

      await startStream(
        {
          message: text,
          userId: uid,
          sessionId: sid,
          aiMessageId,
          adkAppName: ONBOARDING_ADK_APP,
        },
        onMessageUpdate,
        onEventUpdate,
        () => {},
        {
          onMutatingToolResponse: async toolName => {
            if (!isMutatingOnboardingTool(toolName)) return;
            setActivity(labelForMutatingToolResponse(toolName));
            await pullProfileFromSession(uid, sid);
          },
          onStreamActivityHint: hint => {
            if (hint.label?.trim()) setActivity(hint.label);
          },
        }
      );

      setStreamActivityLabel(null);
      await pullProfileFromSession(uid, sid);
    },
    [startStream, pullProfileFromSession]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        setIsInitializing(true);
        const uid = await getAdkUserId();
        if (!uid) {
          setInitError("Could not resolve user for Unibot.");
          return;
        }
        setUserId(uid);

        const created = await createSessionAction(uid, { appName: ONBOARDING_ADK_APP });
        if (!created.success || !created.sessionId) {
          setInitError(created.error ?? "Could not start onboarding chat.");
          return;
        }
        const sid = created.sessionId;
        setSessionId(sid);

        await syncSessionStateAction(
          uid,
          sid,
          {
            ...buildOnboardingProfileStateDelta(dataRef.current, context),
            django_username: uid,
          },
          { appName: ONBOARDING_ADK_APP }
        );

        await runStream(ONBOARDING_START_MESSAGE, uid, sid);
      } catch (e) {
        setInitError(e instanceof Error ? e.message : "Failed to start Unibot");
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [context, runStream]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !userId || !sessionId || isLoading || isAwaitingReply) return;
      setIsAwaitingReply(true);
      setStreamActivityLabel("Reading your answer…");
      appendMessage({ role: "user", text: trimmed });
      try {
        await patchSession(userId, sessionId);
        await runStream(trimmed, userId, sessionId);
      } finally {
        setIsAwaitingReply(false);
      }
    },
    [userId, sessionId, isLoading, isAwaitingReply, appendMessage, patchSession, runStream]
  );

  const hasUserMessage = messages.some(m => m.role === "user");
  const isBusy = isLoading || isInitializing || isAwaitingReply;
  const loadingPhase: OnboardingLoadingPhase = !isBusy ? null : hasUserMessage ? "reply" : "boot";

  return {
    messages,
    sendMessage,
    isLoading: isBusy,
    loadingPhase,
    streamActivityLabel,
    initError,
  };
}
