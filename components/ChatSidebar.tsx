"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Send, Loader2, Minimize2, Maximize2, ChevronDown, ChevronUp, X, ArrowUp, History, Plus, Search } from 'lucide-react';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import { ChatMessage, UnibotImproveRequestDetail } from '../types';
import { Chat, GenerateContentResponse } from "@google/genai";
import Logo from './Logo';

interface ChatSidebarProps {
  incomingRequest?: UnibotImproveRequestDetail | null;
  onRequestHandled?: () => void;
}

/** Max width as fraction of viewport; collapse when width is narrower than this fraction. */
const SIDEBAR_WIDTH_MAX_PCT = 0.3;
const SIDEBAR_WIDTH_COLLAPSE_PCT = 0.1;
const SIDEBAR_DEFAULT_WIDTH_PX = 280;
const LS_SIDEBAR_WIDTH = "unibot-sidebar-width";
const LS_SIDEBAR_COLLAPSED = "unibot-sidebar-collapsed";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Unimad AI. I can help you craft your story, write content for your portfolio, or give feedback on your resume.",
  timestamp: new Date(),
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({ incomingRequest, onRequestHandled }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const footerInputCardRef = useRef<HTMLDivElement>(null);
  const sidebarWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isResizing, setIsResizing] = useState(false);

  // Topic Input State
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  /** When set, main composer sends into this improve topic until cleared. */
  const [improveReplyTopicId, setImproveReplyTopicId] = useState<string | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  useEffect(() => {
    setChatSession(createChatSession());
  }, []);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  /** Restore width / collapsed from localStorage after mount. */
  useEffect(() => {
    try {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const maxPx = vw * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;

      let clamped = SIDEBAR_DEFAULT_WIDTH_PX;
      const raw = localStorage.getItem(LS_SIDEBAR_WIDTH);
      if (raw) {
        const w = parseInt(raw, 10);
        if (!Number.isNaN(w)) {
          if (w < collapsePx) {
            clamped = SIDEBAR_DEFAULT_WIDTH_PX;
          } else {
            clamped = Math.min(maxPx, w);
          }
        }
      }
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;

      if (localStorage.getItem(LS_SIDEBAR_COLLAPSED) === "1") {
        setIsCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /** Keep width within max when the window is resized. */
  useEffect(() => {
    const onResize = () => {
      if (isCollapsed) return;
      setSidebarWidth((w) => {
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

  // Handle Incoming Improvement Requests (resume, LinkedIn, etc.)
  useEffect(() => {
    if (incomingRequest && chatSession) {
      setIsCollapsed(false);
      const topicId = Date.now().toString();

      const isLinkedIn = incomingRequest.type === "linkedin";
      const topicTitle =
        incomingRequest.topicTitle?.trim() ||
        (isLinkedIn ? "LinkedIn" : "Resume · Content improvement");

      const initialUserText = isLinkedIn
        ? incomingRequest.text
        : `Please improve the following text for my resume:\n\n"${incomingRequest.text}"`;

      const initialUserMsg: ChatMessage = {
        id: Date.now().toString() + "_u",
        role: "user",
        text: initialUserText,
        timestamp: new Date(),
      };

      const newTopic: ChatMessage = {
        id: topicId,
        role: "model",
        text: "",
        timestamp: new Date(),
        isTopic: true,
        topicTitle,
        isExpanded: true,
        messages: [initialUserMsg],
      };

      setMessages((prev) => [...prev, newTopic]);

      handleTopicResponse(topicId, initialUserMsg.text);
      setImproveReplyTopicId(topicId);

      if (onRequestHandled) onRequestHandled();
    }
  }, [incomingRequest, chatSession]);

  useEffect(() => {
    if (!improveReplyTopicId) return;
    if (!messages.some((m) => m.id === improveReplyTopicId && m.isTopic)) {
      setImproveReplyTopicId(null);
    }
  }, [messages, improveReplyTopicId]);

  const improveContextTopic = useMemo(
    () => messages.find((m) => m.id === improveReplyTopicId && m.isTopic),
    [messages, improveReplyTopicId]
  );

  /** Main-thread user prompts + improve topics, newest first (for history panel). */
  const historyEntries = useMemo(() => {
    const out: { id: string; title: string; subtitle?: string }[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.isTopic && m.topicTitle) {
        out.push({ id: m.id, title: m.topicTitle, subtitle: "Improve thread" });
      } else if (m.role === "user" && !m.isTopic) {
        const t = m.text.trim().replace(/\s+/g, " ");
        if (t)
          out.push({
            id: m.id,
            title: t.length > 80 ? `${t.slice(0, 78)}…` : t,
          });
      }
    }
    return out;
  }, [messages]);

  const filteredHistoryEntries = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return historyEntries;
    return historyEntries.filter(
      (row) =>
        row.title.toLowerCase().includes(q) || (row.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [historyEntries, historySearchQuery]);

  /** Main chat: new user question → scroll that turn to top (hides prior Q&A). Otherwise follow the thread to the bottom (streaming / replies). */
  useLayoutEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;

    const last = messages[messages.length - 1];
    if (!last) return;

    const apply = () => {
      const c = messagesScrollRef.current;
      if (!c) return;
      const latest = messages[messages.length - 1];
      if (!latest) return;

      if (latest.role === "user" && !latest.isTopic) {
        const el = c.querySelector(`[data-chat-turn="${latest.id}"]`);
        if (el instanceof HTMLElement) {
          const cRect = c.getBoundingClientRect();
          const tRect = el.getBoundingClientRect();
          const nextTop = c.scrollTop + (tRect.top - cRect.top) - 12;
          c.scrollTop = Math.max(0, nextTop);
          return;
        }
      }
      c.scrollTop = c.scrollHeight;
    };

    requestAnimationFrame(() => requestAnimationFrame(apply));
  }, [messages, isCollapsed, isLoading]);

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

  // Topic thread: stream response into nested messages
  const handleTopicResponse = async (topicId: string, prompt: string) => {
    if (!chatSession) return;

    // Add placeholder
    const botMsgId = (Date.now() + 1).toString();
    const placeholderMsg: ChatMessage = {
      id: botMsgId,
      role: 'model',
      text: '',
      timestamp: new Date()
    };

    setMessages(prev => prev.map(msg => {
      if (msg.id === topicId && msg.isTopic) {
        return {
          ...msg,
          messages: [...(msg.messages || []), placeholderMsg]
        };
      }
      return msg;
    }));

    try {
      const stream = await sendMessageStream(chatSession, prompt);
      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk as GenerateContentResponse;
        if (content.text) {
          fullResponse += content.text;
          setMessages(prev => prev.map(msg => {
            if (msg.id === topicId && msg.isTopic) {
              const updatedSubMessages = (msg.messages || []).map(subMsg =>
                subMsg.id === botMsgId ? { ...subMsg, text: fullResponse } : subMsg
              );
              return { ...msg, messages: updatedSubMessages };
            }
            return msg;
          }));
        }
      }
    } catch (error) {
      console.error(error);
      // Handle error inside topic if needed
    }
  };

  const sendUserMessageToTopic = async (topicId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !chatSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === topicId && msg.isTopic
          ? { ...msg, messages: [...(msg.messages || []), userMsg] }
          : msg
      )
    );

    await handleTopicResponse(topicId, trimmed);
  };

  const handleTopicSend = async (topicId: string) => {
    const topicInput = topicInputs[topicId];
    if (!topicInput?.trim() || !chatSession) return;
    const trimmed = topicInput.trim();
    setTopicInputs((prev) => ({ ...prev, [topicId]: '' }));
    await sendUserMessageToTopic(topicId, trimmed);
  };

  const handleSend = async (overrideText?: string) => {
    const raw = overrideText ?? input;
    const textToSend = raw.trim();
    if (!textToSend || !chatSession) return;

    if (improveReplyTopicId && improveContextTopic) {
      setInput('');
      await sendUserMessageToTopic(improveReplyTopicId, textToSend);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await sendMessageStream(chatSession, textToSend);
      processStreamResponse(stream, null);
    } catch (error) {
      handleError(null);
    }
  };

  const processStreamResponse = async (stream: AsyncIterable<GenerateContentResponse>, targetMsgId: string | null) => {
    let fullResponse = '';
    const botMsgId = (Date.now() + 1).toString();

    // If targetMsgId is null, we are in main chat
    if (!targetMsgId) {
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);
    }

    for await (const chunk of stream) {
      const content = chunk as GenerateContentResponse;
      if (content.text) {
        fullResponse += content.text;
        if (!targetMsgId) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
            )
          );
        }
      }
    }
    setIsLoading(false);
  };

  const handleError = (targetMsgId: string | null) => {
    console.error("Chat error");
    const errorMsg = "I'm having trouble connecting right now.";

    if (!targetMsgId) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: errorMsg,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const toggleTopic = (id: string) => {
    setMessages(prev =>
      prev.map((msg) =>
        msg.id === id && msg.isTopic
          ? { ...msg, isExpanded: !(msg.isExpanded !== false) }
          : msg
      )
    );
  };

  const deleteTopic = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const startNewChat = () => {
    const hasThread = messages.some((m) => m.id !== "welcome");
    if (hasThread && !window.confirm("Start a new chat? Your current messages will be cleared.")) {
      return;
    }
    setMessages([{ ...WELCOME_MESSAGE, id: "welcome", timestamp: new Date() }]);
    setTopicInputs({});
    setImproveReplyTopicId(null);
    setInput("");
    setIsLoading(false);
    setHistoryPanelOpen(false);
    setChatSession(createChatSession());
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
      const vw = window.innerWidth;
      const maxPx = vw * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;
      const delta = ev.clientX - startX;
      const next = startW + delta;
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
      cleanup();
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  /** Drag the right edge of the collapsed strip rightward to expand (same thresholds as expanded resize). */
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
      const vw = window.innerWidth;
      const maxPx = vw * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;
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
        expandedDuringDrag = false;
        cleanup();
        return;
      }
      const clamped = Math.min(maxPx, next);
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
    };

    const onUp = () => {
      if (expandedDuringDrag) {
        const vw = window.innerWidth;
        const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;
        if (sidebarWidthRef.current < collapsePx) {
          setIsCollapsed(true);
        }
      }
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
      <div className="relative flex h-full w-16 shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4 transition-all duration-300 dark:border-white/5 dark:bg-[#0d0d0d] z-20">
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
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Logo className="h-6 w-auto text-brand-600 dark:text-brand-400" />
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Messages: chronological; new questions scroll prior answers out of view */}
      <div
        ref={messagesScrollRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-white p-4 dark:bg-[#0d0d0d] no-scrollbar"
      >
        {messages.map((msg) => {
          // --- TOPIC CONTAINER RENDER ---
          if (msg.isTopic) {
            return (
              <div
                key={msg.id}
                data-chat-turn={msg.id}
                className="my-4 ml-1 w-full border-l-2 border-brand-500 pl-4 animate-in fade-in slide-in-from-top-2 dark:border-brand-400"
              >
                {/* Topic Header */}
                <button
                  type="button"
                  onClick={() => toggleTopic(msg.id)}
                  aria-expanded={msg.isExpanded !== false}
                  className="group -mx-1 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors group-hover:text-brand-600 dark:text-slate-400">
                      {msg.topicTitle}
                    </span>
                  </div>
                  {msg.isExpanded !== false ? (
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

                {/* Topic Content */}
                {msg.isExpanded !== false && (
                  <div className="mt-2">
                    <div className="mb-3 flex flex-col gap-4">
                      {msg.messages?.map((subMsg) => (
                        <div key={subMsg.id} className={`flex flex-col gap-1 ${subMsg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`text-[13px] py-2 px-3 leading-relaxed ${subMsg.role === 'user'
                            ? 'bg-slate-50 text-slate-800 rounded-2xl rounded-tr-sm'
                            : 'text-slate-600'
                            }`}>
                            {subMsg.text || <Loader2 size={14} className="animate-spin text-slate-400" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Topic Input - Seamless */}
                    <div className="relative flex items-center gap-2 pt-2">
                      <input
                        value={topicInputs[msg.id] || ''}
                        onChange={(e) => setTopicInputs(prev => ({ ...prev, [msg.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleTopicSend(msg.id)}
                        placeholder="Reply..."
                        className="flex-1 bg-transparent text-[13px] py-2 border-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
                      />
                      <button
                        onClick={() => handleTopicSend(msg.id)}
                        disabled={!topicInputs[msg.id]?.trim()}
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

          // --- STANDARD MESSAGE RENDER ---
          return (
            <div
              key={msg.id}
              data-chat-turn={msg.id}
              className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >


              <div className={`text-[13px] leading-relaxed ${msg.role === 'user'
                ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%]'
                : 'bg-transparent text-slate-600 dark:text-slate-300 px-1 max-w-full'
                }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex flex-col gap-1 items-start pl-1">
            <div className="text-[13px] text-slate-400 flex items-center gap-2 px-1">
              <Loader2 size={14} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Floating Card Input */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-[#0d0d0d]">
        <div
          ref={footerInputCardRef}
          className="relative rounded-xl border border-slate-200/90 bg-white px-3 pt-3 pb-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-[#161616] dark:shadow-[0_1px_2px_rgba(0,0,0,0.14)]"
        >
          {historyPanelOpen && (
            <div
              id="unibot-session-history"
              className="absolute bottom-full left-0 right-0 z-40 mb-2 max-h-[min(280px,48vh)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-[#1a1a1a]"
              role="dialog"
              aria-label="This session history"
            >
              <div className="shrink-0 border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  This session
                </p>
              </div>
              <div className="shrink-0 border-b border-slate-100 px-2 pb-2 pt-1.5 dark:border-slate-700">
                <label htmlFor="unibot-history-search" className="sr-only">
                  Search history
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <input
                    id="unibot-history-search"
                    type="search"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search prompts…"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-[12px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500"
                  />
                </div>
              </div>
              <ul className="max-h-[min(176px,26vh)] overflow-y-auto p-1.5">
                {historyEntries.length === 0 ? (
                  <li className="px-2 py-3 text-center text-[12px] text-slate-400 dark:text-slate-500">
                    No prompts yet — ask something below.
                  </li>
                ) : filteredHistoryEntries.length === 0 ? (
                  <li className="px-2 py-3 text-center text-[12px] text-slate-400 dark:text-slate-500">
                    No results match “{historySearchQuery.trim()}”.
                  </li>
                ) : (
                  filteredHistoryEntries.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-2 py-2 text-left text-[12px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                        onClick={() => setHistoryPanelOpen(false)}
                      >
                        <span className="line-clamp-2 font-medium leading-snug">{row.title}</span>
                        {row.subtitle ? (
                          <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-500">{row.subtitle}</span>
                        ) : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          {improveReplyTopicId && improveContextTopic?.topicTitle ? (
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="min-w-0 truncate">
                  Reply to: {improveContextTopic.topicTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setImproveReplyTopicId(null)}
                  className="shrink-0 rounded-full p-0.5 text-brand-700 transition-colors hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-500/30"
                  aria-label="Cancel — reply to full conversation instead"
                >
                  <X size={13} strokeWidth={2} aria-hidden />
                </button>
              </span>
            </div>
          ) : null}
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-grow
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={improveReplyTopicId && improveContextTopic ? 'Reply in this topic…' : 'Ask anything'}
            rows={1}
            className="w-full min-h-[48px] max-h-48 resize-none overflow-y-auto border-none bg-transparent px-0 py-1 text-[13px] outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />

          <div className="flex items-center justify-between gap-2 pl-1">
            <button
              type="button"
              onClick={() => setHistoryPanelOpen((o) => !o)}
              className={`rounded-full p-2 transition-colors ${
                historyPanelOpen
                  ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="Session history"
              aria-expanded={historyPanelOpen}
              aria-controls="unibot-session-history"
            >
              <History size={18} aria-hidden />
            </button>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                disabled={isLoading}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                title={isLoading ? "Wait for the reply to finish" : "New chat"}
                aria-label="New chat"
              >
                <Plus size={18} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
                aria-label="Send message"
              >
                <ArrowUp size={16} aria-hidden />
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
    </div>
  );
};

export default ChatSidebar;