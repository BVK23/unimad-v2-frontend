"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { syncSessionStateAction } from "@/features/adk-chat/actions";
import { formatUnibotStreamError, type FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import { generateMainSessionTitleIfNeeded } from "@/features/adk-chat/generate-main-session-title";
import { resolveImproveSubSession } from "@/features/adk-chat/improve-sub-session";
import {
  findImproveTopic,
  insertTopicInMainThread,
  loadSubSessionChatMessages,
  topicIdForSubSession,
} from "@/features/adk-chat/improve-topic-helpers";
import { getSessionDisplayName, getSessionMeta, groupSessionsForSidebar } from "@/features/adk-chat/session-metadata";
import { useAdkResumeReviewStore, type AdkReviewCard } from "@/features/adk-chat/stores/useAdkResumeReviewStore";
import { buildAdkResumeDataMap } from "@/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import { UNTITLED_THREAD_TITLE } from "@/src/features/adk-chat/constants";
import { getRegistryRow, upsertRegistryRow } from "@/src/features/adk-chat/session-registry";
import { registerUnibotAdkSessionAction } from "@/src/features/adk-chat/unibot-adk-session-actions";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Minimize2, Maximize2, ChevronDown, ChevronUp, ArrowUp, History, Plus, Search, Trash2, X } from "lucide-react";
import type { ChatMessage } from "../types";
import Logo from "./Logo";
import { useAdkChatContext } from "./chat/AdkChatProvider";
import { FormattedAgentMessage } from "./chat/FormattedAgentMessage";
import { UnibotErrorBubble } from "./chat/UnibotErrorBubble";
import { type UnibotIncomingRequest, incomingRequestSignature, UNIBOT_SECTION_REVIEW_PROMPTS } from "./chat/unibot-incoming-request";

interface ChatSidebarProps {
  incomingRequest?: UnibotIncomingRequest | null;
  onRequestHandled?: () => void;
}

const SIDEBAR_WIDTH_MAX_PCT = 0.3;
const SIDEBAR_WIDTH_COLLAPSE_PCT = 0.1;
const SIDEBAR_DEFAULT_WIDTH_PX = 280;
const LS_SIDEBAR_WIDTH = "unibot-sidebar-width";
const LS_SIDEBAR_COLLAPSED = "unibot-sidebar-collapsed";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function AdkResumeReviewCardBlock({
  card,
  isActive,
  adkReviewBusy,
  sessionReady,
  onAccept,
  onDiscard,
}: {
  card: AdkReviewCard;
  isActive: boolean;
  adkReviewBusy: boolean;
  sessionReady: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className={`mt-2 w-full max-w-[95%] rounded-xl border px-3 py-2.5 shadow-sm transition-opacity ${
        isActive
          ? "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#141414]"
          : "border-slate-100 bg-slate-50/70 opacity-70 dark:border-white/5 dark:bg-[#121212]"
      }`}
    >
      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{card.bannerTitle}</p>
      {isActive ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={adkReviewBusy || !sessionReady}
            onClick={() => void onAccept()}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              {adkReviewBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              Accept
            </span>
          </button>
          <button
            type="button"
            disabled={adkReviewBusy || !sessionReady}
            onClick={() => void onDiscard()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200 dark:hover:bg-white/5 disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          Replaced by a newer edit. Use the latest review below to accept or discard.
        </p>
      )}
    </div>
  );
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ incomingRequest, onRequestHandled }) => {
  const {
    messages,
    setMessages,
    sendMainMessage,
    sendTopicMessage,
    isAgentLoading,
    streamActivityLabel,
    sessionReady,
    userId,
    sessionId,
    sessions,
    isLoadingHistory,
    sessionError,
    isBootstrappingSession,
    handleSessionSwitch,
    handleCreateNewSession,
    handleDeleteSession,
    refreshSessions,
  } = useAdkChatContext();

  const [input, setInput] = useState("");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const footerInputCardRef = useRef<HTMLDivElement>(null);
  const sidebarWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isResizing, setIsResizing] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [allChatsOpen, setAllChatsOpen] = useState(true);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  const [improveReplyTopicId, setImproveReplyTopicId] = useState<string | null>(null);
  const lastIncomingSigRef = useRef<string | null>(null);
  const pendingRetryRef = useRef<{ text: string; topicId?: string } | null>(null);
  const [streamError, setStreamError] = useState<FormattedUnibotStreamError | null>(null);
  const queryClient = useQueryClient();
  const adkReviewStack = useAdkResumeReviewStore(s => s.reviewStack);
  const adkActiveReviewId = useAdkResumeReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const [adkReviewBusy, setAdkReviewBusy] = useState(false);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const maxPx = vw * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;
      let clamped = SIDEBAR_DEFAULT_WIDTH_PX;
      const raw = localStorage.getItem(LS_SIDEBAR_WIDTH);
      if (raw) {
        const w = parseInt(raw, 10);
        if (!Number.isNaN(w)) clamped = w < collapsePx ? SIDEBAR_DEFAULT_WIDTH_PX : Math.min(maxPx, w);
      }
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
      if (localStorage.getItem(LS_SIDEBAR_COLLAPSED) === "1") setIsCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (isCollapsed) return;
      setSidebarWidth(w => {
        const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
        const next = Math.min(w, maxPx);
        sidebarWidthRef.current = next;
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isCollapsed]);

  const skipInitialCollapsePersist = useRef(true);
  useEffect(() => {
    if (skipInitialCollapsePersist.current) {
      skipInitialCollapsePersist.current = false;
      return;
    }
    try {
      localStorage.setItem(LS_SIDEBAR_COLLAPSED, isCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [isCollapsed]);

  const skipInitialWidthPersist = useRef(true);
  useEffect(() => {
    if (skipInitialWidthPersist.current) {
      skipInitialWidthPersist.current = false;
      return;
    }
    if (isCollapsed) return;
    try {
      localStorage.setItem(LS_SIDEBAR_WIDTH, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth, isCollapsed]);

  const applyAssistantError = useCallback(
    (formatted: FormattedUnibotStreamError, target: { scope: "main" } | { scope: "topic"; topicId: string; botMsgId: string }) => {
      if (target.scope === "main") {
        setMessages(prev => {
          for (let i = prev.length - 1; i >= 0; i--) {
            const m = prev[i];
            if (m.role === "model" && !m.isTopic && (m.text === "" || m.isError)) {
              const next = [...prev];
              next[i] = {
                ...m,
                text: formatted.message,
                isError: true,
                errorKind: formatted.kind,
              };
              return next;
            }
          }
          return prev;
        });
        return;
      }
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== target.topicId || !msg.isTopic) return msg;
          const updated = (msg.messages || []).map(sub =>
            sub.id === target.botMsgId ? { ...sub, text: formatted.message, isError: true, errorKind: formatted.kind } : sub
          );
          return { ...msg, messages: updated };
        })
      );
    },
    [setMessages]
  );

  const handleStreamFailure = useCallback(
    (err: unknown, ctx: { text: string; topicId?: string; botMsgId?: string }) => {
      const formatted = formatUnibotStreamError(err);
      pendingRetryRef.current = { text: ctx.text, topicId: ctx.topicId };
      if (ctx.topicId && ctx.botMsgId) {
        applyAssistantError(formatted, { scope: "topic", topicId: ctx.topicId, botMsgId: ctx.botMsgId });
      } else {
        applyAssistantError(formatted, { scope: "main" });
      }
      setStreamError(formatted);
    },
    [applyAssistantError]
  );

  const clearErrorMessages = useCallback(() => {
    setMessages(prev =>
      prev
        .map(msg => {
          if (msg.isTopic && msg.messages?.length) {
            const inner = msg.messages.filter(m => !(m.role === "model" && m.isError));
            return inner.length === msg.messages.length ? msg : { ...msg, messages: inner };
          }
          return msg;
        })
        .filter(m => !(m.role === "model" && !m.isTopic && m.isError))
    );
  }, [setMessages]);

  const groupedSessions = useMemo(() => (userId ? groupSessionsForSidebar(userId, sessions) : []), [userId, sessions]);

  const currentMainSessionId = useMemo(() => {
    if (!userId || !sessionId) return null;
    const meta = getSessionMeta(userId, sessionId);
    if (meta?.kind === "sub" && meta.parentSessionId) return meta.parentSessionId;
    return sessionId;
  }, [userId, sessionId]);

  const thisSessionSubs = useMemo(() => {
    if (!currentMainSessionId) return [];
    const group = groupedSessions.find(g => g.id === currentMainSessionId);
    return group?.subs ?? [];
  }, [groupedSessions, currentMainSessionId]);

  /** Improve topics embedded in the main transcript (for "This session" panel). */
  const improveTopicEntries = useMemo(() => {
    const out: { id: string; title: string; subtitle?: string }[] = [];
    for (const m of messages) {
      if (m.isTopic && m.topicTitle) {
        out.push({ id: m.id, title: m.topicTitle, subtitle: "Improve thread" });
      }
    }
    return out.reverse();
  }, [messages]);

  const sessionSubEntries = useMemo(() => {
    const topicSubIds = new Set(messages.filter(m => m.isTopic && m.subSessionAdkId).map(m => m.subSessionAdkId as string));
    return thisSessionSubs
      .filter(s => !topicSubIds.has(s.id))
      .map(s => ({
        topicId: topicIdForSubSession(s.id),
        subAdkSessionId: s.id,
        title: s.title,
        subtitle: "Improve thread" as const,
      }));
  }, [messages, thisSessionSubs]);

  const thisSessionListEntries = useMemo(() => {
    const fromTopics = improveTopicEntries.map(row => {
      const topic = messages.find(m => m.id === row.id && m.isTopic);
      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        subAdkSessionId: topic?.subSessionAdkId,
      };
    });
    const fromRegistry = sessionSubEntries.map(row => ({
      id: row.topicId,
      title: row.title,
      subtitle: row.subtitle,
      subAdkSessionId: row.subAdkSessionId,
    }));
    return [...fromTopics, ...fromRegistry];
  }, [improveTopicEntries, sessionSubEntries, messages]);

  const filteredThisSessionList = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return thisSessionListEntries;
    return thisSessionListEntries.filter(row => row.title.toLowerCase().includes(q) || (row.subtitle?.toLowerCase().includes(q) ?? false));
  }, [thisSessionListEntries, historySearchQuery]);

  const openImproveSubTopic = useCallback(
    async (subAdkSessionId: string, title: string, promptText: string) => {
      const topicId = topicIdForSubSession(subAdkSessionId);
      const existing = findImproveTopic(messages, subAdkSessionId);

      if (!existing) {
        const nested = await loadSubSessionChatMessages(userId, subAdkSessionId);
        const userMsg: ChatMessage = {
          id: newId("u"),
          role: "user",
          text: promptText,
          timestamp: new Date(),
        };
        const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
        const placeholderMsg: ChatMessage = {
          id: botMsgId,
          role: "model",
          text: "",
          timestamp: new Date(),
        };
        const newTopic: ChatMessage = {
          id: topicId,
          role: "model",
          text: "",
          timestamp: new Date(),
          isTopic: true,
          topicTitle: title,
          isExpanded: true,
          subSessionAdkId: subAdkSessionId,
          messages: [...nested, userMsg, placeholderMsg],
        };
        setMessages(prev => insertTopicInMainThread(prev, newTopic));
        setImproveReplyTopicId(topicId);
        pendingRetryRef.current = { text: promptText, topicId };
        try {
          await sendTopicMessage(promptText, botMsgId, { sessionIdOverride: subAdkSessionId });
          pendingRetryRef.current = null;
        } catch (err) {
          handleStreamFailure(err, { text: promptText, topicId, botMsgId });
        }
        return;
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: promptText,
        timestamp: new Date(),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };

      setMessages(prev =>
        prev.map(msg =>
          msg.id === topicId && msg.isTopic
            ? {
                ...msg,
                topicTitle: title,
                isExpanded: true,
                messages: [...(msg.messages || []), userMsg, placeholderMsg],
              }
            : msg
        )
      );
      setImproveReplyTopicId(topicId);
      pendingRetryRef.current = { text: promptText, topicId };
      try {
        await sendTopicMessage(promptText, botMsgId, { sessionIdOverride: subAdkSessionId });
        pendingRetryRef.current = null;
      } catch (err) {
        handleStreamFailure(err, { text: promptText, topicId, botMsgId });
      }
    },
    [messages, userId, setMessages, sendTopicMessage, handleStreamFailure]
  );

  useEffect(() => {
    const req = incomingRequest;
    if (!req) {
      lastIncomingSigRef.current = null;
      return;
    }
    if (!sessionReady) return;

    const sig = incomingRequestSignature(req);
    if (lastIncomingSigRef.current === sig) return;
    lastIncomingSigRef.current = sig;
    onRequestHandled?.();

    setTimeout(() => {
      setIsCollapsed(false);
    }, 0);

    if (req.type === "section_review") {
      const prompt = UNIBOT_SECTION_REVIEW_PROMPTS[req.section];
      if (!prompt) return;

      void (async () => {
        try {
          if (!userId || !sessionReady) return;
          await sendMainMessage(prompt, { excludeFromTitleGeneration: true });
        } catch (err) {
          handleStreamFailure(err, { text: prompt });
        }
      })();
      return;
    }

    const isResumeSub = req.improveType === "resume" && Boolean(req.featureId && req.section);

    const isLinkedIn = req.improveType === "linkedin";
    const promptText = isLinkedIn ? req.text.trim() : `Please improve the following text for my resume:\n\n"${req.text}"`;

    void (async () => {
      try {
        if (!userId || !sessionReady) return;

        if (isResumeSub && req.featureId && req.section) {
          const mainId = currentMainSessionId ?? sessionId;
          if (!getRegistryRow(mainId)) {
            const regMain = await registerUnibotAdkSessionAction({
              adk_session_id: mainId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
            });
            if (regMain.session) upsertRegistryRow(regMain.session);
          }

          const resolved = await resolveImproveSubSession({
            userId,
            mainAdkSessionId: mainId,
            feature: req.feature ?? "resume",
            featureId: req.featureId,
            section: req.section,
            entryId: req.entryId,
          });

          if (!resolved.success || !resolved.adkSessionId) {
            throw new Error(resolved.error ?? "Could not open improve chat");
          }

          await refreshSessions();
          await openImproveSubTopic(resolved.adkSessionId, resolved.title ?? "Resume · Content improvement", promptText);
        } else {
          setImproveReplyTopicId(null);
          await sendMainMessage(promptText, { excludeFromTitleGeneration: true });
        }
      } catch (err) {
        handleStreamFailure(err, { text: promptText });
      }
    })();
  }, [
    incomingRequest,
    sessionReady,
    sendMainMessage,
    onRequestHandled,
    handleStreamFailure,
    userId,
    sessionId,
    currentMainSessionId,
    refreshSessions,
    openImproveSubTopic,
  ]);

  useEffect(() => {
    if (!improveReplyTopicId) return;
    if (!messages.some(m => m.id === improveReplyTopicId && m.isTopic)) setImproveReplyTopicId(null);
  }, [messages, improveReplyTopicId]);

  const improveContextTopic = useMemo(() => messages.find(m => m.id === improveReplyTopicId && m.isTopic), [messages, improveReplyTopicId]);

  // Standard chat ordering: oldest at the top, newest at the bottom, with the
  // scroll viewport pinned to the latest message. The newest-first reverse
  // from the designer commit was inverting both new chats and history, so we
  // drop it and scroll to the bottom on each update.
  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      const el = messagesScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToLatest();
  }, [messages, isCollapsed, adkReviewStack, adkActiveReviewId]);

  useEffect(() => {
    if (!historyPanelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (footerInputCardRef.current?.contains(e.target as Node)) return;
      setHistoryPanelOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [historyPanelOpen]);

  useEffect(() => {
    if (!historyPanelOpen) setHistorySearchQuery("");
  }, [historyPanelOpen]);

  const canSendMessage = Boolean(userId && sessionReady && !isAgentLoading && !isLoadingHistory);
  const canSend = canSendMessage && !streamError;

  const canUseHistory = Boolean(userId && !isBootstrappingSession);

  const handleAdkAccept = useCallback(async () => {
    setAdkReviewBusy(true);
    try {
      await useAdkResumeReviewStore.getState().acceptAndSave();
    } catch (err) {
      console.error("ADK resume accept failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, []);

  const handleAdkDiscard = useCallback(async () => {
    const baseline = useAdkResumeReviewStore.getState().getBaselineResume();
    if (!baseline || !userId || !sessionId) return;
    setAdkReviewBusy(true);
    try {
      const merged = { ...useResumeStore.getState().resumeData, [baseline.id]: baseline };
      useResumeStore.setState({ resumeData: merged });
      queryClient.setQueryData(resumeByIdQueryKey(baseline.id), baseline);
      await syncSessionStateAction(userId, sessionId, {
        active_context: "resume",
        current_resume: baseline.id,
        resume_data: buildAdkResumeDataMap(merged),
      });
      useAdkResumeReviewStore.getState().popReviewAfterDiscard();
      window.dispatchEvent(
        new CustomEvent("resume-adk-discard", {
          detail: { resumeId: baseline.id, baselineJson: JSON.stringify(baseline) },
        })
      );
    } catch (err) {
      console.error("ADK resume discard failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [queryClient, sessionId, userId]);

  const sendUserMessageToTopic = async (topicId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !canSend) return;
    const topic = messages.find(m => m.id === topicId && m.isTopic);
    const subAdkId = topic?.subSessionAdkId;
    const userMsg: ChatMessage = { id: newId("u"), role: "user", text: trimmed, timestamp: new Date() };
    const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
    const placeholderMsg: ChatMessage = { id: botMsgId, role: "model", text: "", timestamp: new Date() };
    setMessages(prev =>
      prev.map(msg =>
        msg.id === topicId && msg.isTopic ? { ...msg, messages: [...(msg.messages || []), userMsg, placeholderMsg], isExpanded: true } : msg
      )
    );
    pendingRetryRef.current = { text: trimmed, topicId };
    try {
      await sendTopicMessage(trimmed, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
      pendingRetryRef.current = null;
    } catch (err) {
      handleStreamFailure(err, { text: trimmed, topicId, botMsgId });
    }
  };

  const handleSend = async (overrideText?: string, options?: { afterRetry?: boolean }) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || !canSendMessage) return;
    if (!options?.afterRetry && streamError) return;
    setStreamError(null);
    if (improveReplyTopicId && improveContextTopic) {
      setInput("");
      await sendUserMessageToTopic(improveReplyTopicId, textToSend);
      return;
    }
    setInput("");
    pendingRetryRef.current = { text: textToSend };
    const mainId = currentMainSessionId ?? sessionId;
    try {
      await sendMainMessage(textToSend);
      pendingRetryRef.current = null;
      void generateMainSessionTitleIfNeeded(mainId, textToSend, refreshSessions);
    } catch (err) {
      handleStreamFailure(err, { text: textToSend });
    }
  };

  const retryFailedStream = useCallback(() => {
    const pending = pendingRetryRef.current;
    if (!pending || !userId || !sessionReady || isAgentLoading || isLoadingHistory) return;
    setStreamError(null);
    clearErrorMessages();
    void handleSend(pending.text, { afterRetry: true });
  }, [userId, sessionReady, isAgentLoading, isLoadingHistory, clearErrorMessages, handleSend]);

  const onNewChat = async () => {
    if (!canUseHistory) return;
    try {
      await handleCreateNewSession({ kind: "main" });
      await refreshSessions();
      setHistoryPanelOpen(false);
      setImproveReplyTopicId(null);
      setStreamError(null);
      pendingRetryRef.current = null;
    } catch {
      /* sessionError surfaced by provider */
    }
  };

  const onDeleteSession = async (sessionIdToDelete: string) => {
    if (!canUseHistory || isAgentLoading) return;
    setIsDeletingSession(true);
    try {
      await handleDeleteSession(sessionIdToDelete);
      await refreshSessions();
      setImproveReplyTopicId(null);
      setPendingDeleteSession(null);
    } catch {
      /* sessionError surfaced by provider */
    } finally {
      setIsDeletingSession(false);
    }
  };

  const handleTopicSend = async (topicId: string) => {
    const topicInput = topicInputs[topicId];
    if (!topicInput?.trim() || !canSend) return;

    const userMsg: ChatMessage = {
      id: newId("u"),
      role: "user",
      text: topicInput,
      timestamp: new Date(),
    };

    const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");

    const placeholderMsg: ChatMessage = {
      id: botMsgId,
      role: "model",
      text: "",
      timestamp: new Date(),
    };

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === topicId && msg.isTopic) {
          return {
            ...msg,
            messages: [...(msg.messages || []), userMsg, placeholderMsg],
          };
        }
        return msg;
      })
    );

    setTopicInputs(prev => ({ ...prev, [topicId]: "" }));

    const topic = messages.find(m => m.id === topicId && m.isTopic);
    const subAdkId = topic?.subSessionAdkId;
    const trimmed = topicInput.trim();
    pendingRetryRef.current = { text: trimmed, topicId };
    try {
      await sendTopicMessage(trimmed, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
      pendingRetryRef.current = null;
    } catch (err) {
      handleStreamFailure(err, { text: trimmed, topicId, botMsgId });
    }
  };

  const selectImproveTopic = (topicId: string) => {
    setImproveReplyTopicId(topicId);
    setMessages(prev => prev.map(msg => (msg.id === topicId && msg.isTopic ? { ...msg, isExpanded: true } : msg)));
    setHistoryPanelOpen(false);
  };

  const selectImproveSubFromRegistry = async (subAdkSessionId: string, title: string) => {
    const topicId = topicIdForSubSession(subAdkSessionId);
    if (!findImproveTopic(messages, subAdkSessionId)) {
      const nested = await loadSubSessionChatMessages(userId, subAdkSessionId);
      setMessages(prev => [
        ...prev,
        {
          id: topicId,
          role: "model",
          text: "",
          timestamp: new Date(),
          isTopic: true,
          topicTitle: title,
          isExpanded: true,
          subSessionAdkId: subAdkSessionId,
          messages: nested,
        },
      ]);
    }
    selectImproveTopic(topicId);
  };

  const toggleTopic = (id: string) => {
    setMessages(prev => prev.map(msg => (msg.id === id ? { ...msg, isExpanded: !msg.isExpanded } : msg)));
  };

  const deleteTopic = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    if (improveReplyTopicId === id) setImproveReplyTopicId(null);
  };

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault();
    setIsResizing(true);
    const startX = event.clientX;
    const startW = sidebarWidthRef.current;
    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT;
      const next = startW + (ev.clientX - startX);
      if (next < collapsePx) {
        setIsCollapsed(true);
        cleanup();
        return;
      }
      const clamped = Math.min(maxPx, next);
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
    };
    const onUp = () => cleanup();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  const startResizeFromCollapsed = (event: React.PointerEvent) => {
    event.preventDefault();
    setIsResizing(true);
    let expandedDuringDrag = false;
    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT;
      const next = ev.clientX;
      if (!expandedDuringDrag) {
        if (next >= collapsePx) {
          expandedDuringDrag = true;
          setIsCollapsed(false);
          const w = Math.min(maxPx, next);
          setSidebarWidth(w);
          sidebarWidthRef.current = w;
        }
        return;
      }
      if (next < collapsePx) {
        setIsCollapsed(true);
        cleanup();
        return;
      }
      const clamped = Math.min(maxPx, next);
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
    };
    const onUp = () => {
      if (expandedDuringDrag && sidebarWidthRef.current < window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT) setIsCollapsed(true);
      cleanup();
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d0d0d] flex flex-col items-center py-4 h-full transition-all duration-300 z-20">
        <div className="h-16 flex items-center justify-center mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <Maximize2 size={20} />
        </button>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize Unibot"
          onPointerDown={startResizeFromCollapsed}
          className="absolute right-0 top-0 z-30 flex h-full w-3 cursor-col-resize select-none justify-end touch-none hover:bg-slate-200/40 dark:hover:bg-white/5"
        >
          <span className="pointer-events-none h-full w-px shrink-0 bg-slate-200 dark:bg-white/15" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#0d0d0d] z-20 ${
        isResizing ? "" : "transition-[width] duration-200 ease-out"
      }`}
      style={{ width: sidebarWidth }}
    >
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0d0d0d]/80">
        <Logo className="h-6 w-auto text-brand-600 dark:text-brand-400" />
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      <div
        ref={messagesScrollRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-white p-4 dark:bg-[#0d0d0d] scrollbar-on-hover"
      >
        {!userId && <p className="text-[11px] text-slate-400 px-1">Sign in to chat with Unibot.</p>}
        {userId && !sessionReady && (
          <p className="text-[11px] text-slate-400 px-1">
            {sessionError ? `Assistant: ${sessionError}` : isLoadingHistory ? "Loading chat…" : "Connecting to assistant…"}
          </p>
        )}

        {messages.map(msg => {
          if (msg.isTopic) {
            const expanded = msg.isExpanded !== false;
            return (
              <div
                key={msg.id}
                className="my-4 ml-1 w-full border-l-2 border-brand-500 pl-4 animate-in fade-in slide-in-from-bottom-2 dark:border-brand-400"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(msg.id)}
                  aria-expanded={expanded}
                  className="group -mx-1 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors group-hover:text-brand-600 dark:text-slate-400">
                    {msg.topicTitle}
                  </span>
                  {expanded ? (
                    <ChevronUp
                      size={16}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      aria-hidden
                    />
                  )}
                </button>

                {expanded && (
                  <div className="mt-2">
                    <div className="mb-3 flex flex-col gap-4">
                      {msg.messages?.map(subMsg => (
                        <div key={subMsg.id} className={`flex flex-col gap-1 ${subMsg.role === "user" ? "items-end" : "items-start"}`}>
                          {subMsg.isError ? (
                            <UnibotErrorBubble message={subMsg} onRetry={retryFailedStream} />
                          ) : (
                            <div
                              className={`text-[13px] py-2 px-3 leading-relaxed ${
                                subMsg.role === "user"
                                  ? "bg-slate-50 text-slate-800 rounded-2xl rounded-tr-sm"
                                  : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {subMsg.role === "model" && subMsg.text ? (
                                <FormattedAgentMessage content={subMsg.text} />
                              ) : subMsg.text ? (
                                <span className="whitespace-pre-wrap">{subMsg.text}</span>
                              ) : (
                                <Loader2 size={14} className="animate-spin text-slate-400" />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="relative flex items-center gap-2 pt-2">
                      <input
                        value={topicInputs[msg.id] || ""}
                        onChange={e =>
                          setTopicInputs(prev => ({
                            ...prev,
                            [msg.id]: e.target.value,
                          }))
                        }
                        onKeyDown={e => e.key === "Enter" && handleTopicSend(msg.id)}
                        placeholder="Reply..."
                        disabled={!canSend}
                        className="flex-1 bg-transparent text-[13px] py-2 border-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleTopicSend(msg.id)}
                        disabled={!topicInputs[msg.id]?.trim() || !canSend}
                        className="text-slate-300 hover:text-brand-600 disabled:opacity-0 transition-all p-2"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.isError ? (
                <UnibotErrorBubble message={msg} onRetry={retryFailedStream} />
              ) : (
                <div
                  className={`text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%]"
                      : "bg-transparent text-slate-600 dark:text-slate-300 px-1 max-w-full"
                  }`}
                >
                  {msg.role === "model" && msg.text ? (
                    <FormattedAgentMessage content={msg.text} />
                  ) : msg.text ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : null}
                </div>
              )}
              {msg.role === "model" &&
                adkReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map(card => (
                    <AdkResumeReviewCardBlock
                      key={card.id}
                      card={card}
                      isActive={card.id === adkActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkAccept}
                      onDiscard={handleAdkDiscard}
                    />
                  ))}
            </div>
          );
        })}

        {adkReviewStack.some(c => !c.assistantMessageId) && (
          <div className="flex flex-col gap-2 items-start pl-1">
            {adkReviewStack
              .filter(c => !c.assistantMessageId)
              .map(card => (
                <AdkResumeReviewCardBlock
                  key={card.id}
                  card={card}
                  isActive={card.id === adkActiveReviewId}
                  adkReviewBusy={adkReviewBusy}
                  sessionReady={sessionReady}
                  onAccept={handleAdkAccept}
                  onDiscard={handleAdkDiscard}
                />
              ))}
          </div>
        )}

        {isAgentLoading && (
          <div className="flex flex-col gap-1 items-start pl-1">
            <div className="text-[13px] text-slate-400 flex items-center gap-2 px-1">
              <Loader2 size={14} className="animate-spin" />
              <span>{streamActivityLabel ?? "Thinking…"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-[#0d0d0d] border-t border-slate-100 dark:border-white/5">
        <div
          ref={footerInputCardRef}
          className="relative rounded-xl border border-slate-200/90 bg-white px-3 pt-3 pb-2 shadow-sm dark:border-slate-700/80 dark:bg-[#161616]"
        >
          {improveReplyTopicId && improveContextTopic?.topicTitle ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">Reply to: {improveContextTopic.topicTitle}</span>
                <button
                  type="button"
                  onClick={() => setImproveReplyTopicId(null)}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear reply target"
                >
                  <X size={13} />
                </button>
              </span>
            </div>
          ) : null}
          {streamError ? (
            <p className="mb-2 rounded-lg border border-red-200/70 bg-red-50/80 px-2.5 py-2 text-[11px] leading-snug text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200">
              Resolve the error above or tap <span className="font-medium">Try again</span> before sending a new message.
            </p>
          ) : null}
          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              streamError
                ? "Fix the error above to continue…"
                : improveReplyTopicId && improveContextTopic
                  ? "Reply in this topic…"
                  : "Ask anything"
            }
            rows={1}
            disabled={!canSend}
            className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 resize-none max-h-48 overflow-y-auto min-h-[48px] py-1 px-1 mb-2 disabled:opacity-50"
          />

          <div className="flex justify-between items-center pl-1">
            {/*
              Voice (mic) input — deferred. History control opens past chats (ADK sessions).
              <button type="button" ...><Mic size={18} /></button>
            */}
            <div className="relative" ref={footerInputCardRef}>
              <button
                type="button"
                onClick={() => setHistoryPanelOpen(o => !o)}
                disabled={!canUseHistory}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                title="Chat history"
                aria-expanded={historyPanelOpen}
                aria-haspopup="listbox"
              >
                <History size={18} />
              </button>
              {historyPanelOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 z-40 mb-2 max-h-[min(320px,50vh)] w-[min(280px,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-[#1a1a1a]"
                  role="dialog"
                  aria-label="Chat history"
                >
                  {thisSessionListEntries.length > 0 && (
                    <>
                      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">This session</p>
                      </div>
                      <div className="border-b border-slate-100 px-2 pb-2 pt-1.5 dark:border-slate-700">
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                            aria-hidden
                          />
                          <input
                            type="search"
                            value={historySearchQuery}
                            onChange={e => setHistorySearchQuery(e.target.value)}
                            placeholder="Search sub-chats…"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-[12px] outline-none dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <ul className="max-h-[min(120px,18vh)] overflow-y-auto p-1.5">
                        {filteredThisSessionList.map(row => {
                          const active = improveReplyTopicId === row.id;
                          return (
                            <li key={row.id}>
                              <button
                                type="button"
                                className={`w-full rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                                  active ? "bg-slate-100 dark:bg-white/10" : ""
                                }`}
                                onClick={() => {
                                  if (row.subAdkSessionId) {
                                    void selectImproveSubFromRegistry(row.subAdkSessionId, row.title);
                                  } else {
                                    selectImproveTopic(row.id);
                                  }
                                }}
                              >
                                <span className="line-clamp-2 font-medium">{row.title}</span>
                                {row.subtitle ? <span className="text-[10px] text-slate-400">{row.subtitle}</span> : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  <div
                    className={`px-3 py-2 ${thisSessionListEntries.length > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">All chats</p>
                  </div>
                  <ul className="scrollbar-on-hover max-h-[min(140px,22vh)] overflow-y-auto py-1" role="listbox">
                    {groupedSessions.length === 0 && <li className="px-3 py-2 text-[11px] text-slate-400">No other chats yet</li>}
                    {groupedSessions.map(group => {
                      const activeMain =
                        group.id === sessionId || group.id === currentMainSessionId || group.subs.some(s => s.id === sessionId);
                      return (
                        <li key={group.id}>
                          <div
                            className={`group flex items-center gap-1 py-1 px-1 hover:bg-slate-50 dark:hover:bg-white/5 ${
                              activeMain ? "bg-slate-100 dark:bg-white/10" : ""
                            }`}
                          >
                            <button
                              type="button"
                              role="option"
                              aria-selected={activeMain}
                              onClick={() => {
                                handleSessionSwitch(group.id);
                                setImproveReplyTopicId(null);
                                setHistoryPanelOpen(false);
                              }}
                              className={`min-w-0 flex-1 text-left text-[12px] py-1 px-2 truncate ${
                                activeMain ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {group.title}
                            </button>
                            {group.canDelete ? (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setPendingDeleteSession({ id: group.id, title: group.title });
                                }}
                                disabled={isAgentLoading}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-20"
                                title="Delete chat session"
                                aria-label={`Delete ${group.title}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void onNewChat()}
                disabled={!canUseHistory || isAgentLoading}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                title="New thread"
                aria-label="New thread"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || !canSend}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 font-medium">
          AI can make mistakes. Please double-check responses.
        </p>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Unibot panel"
        onPointerDown={startResize}
        className="absolute right-0 top-0 z-30 flex h-full w-3 cursor-col-resize select-none justify-end touch-none hover:bg-slate-200/40 dark:hover:bg-white/5"
      >
        <span className="pointer-events-none h-full w-px shrink-0 bg-slate-200 dark:bg-white/15" />
      </div>

      {pendingDeleteSession &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-session-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 id="delete-chat-session-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  Delete chat session?
                </h2>
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  disabled={isDeletingSession}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                  aria-label="Close delete confirmation"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  This will delete <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDeleteSession.title}</span> from
                  your chat history.
                </p>
                <p className="text-[12px] text-slate-400 mt-2">This action cannot be undone.</p>
              </div>

              <div className="p-5 pt-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  disabled={isDeletingSession}
                  className="px-3 py-2 text-[12px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteSession(pendingDeleteSession.id)}
                  disabled={isDeletingSession}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {isDeletingSession ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ChatSidebar;
