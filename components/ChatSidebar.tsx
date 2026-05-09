import React, { useState, useEffect, useRef, useCallback } from "react";
import { syncSessionStateAction } from "@/features/adk-chat/actions";
import { useAdkResumeReviewStore } from "@/features/adk-chat/stores/useAdkResumeReviewStore";
import { buildAdkResumeDataMap } from "@/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, Minimize2, Maximize2, ArrowUp, MessageSquare, History, Trash2, X } from "lucide-react";
import type { ChatMessage } from "../types";
import Logo from "./Logo";
import { useAdkChatContext } from "./chat/AdkChatProvider";
import { type UnibotIncomingRequest, UNIBOT_SECTION_REVIEW_PROMPTS } from "./chat/unibot-incoming-request";

interface ChatSidebarProps {
  incomingRequest?: UnibotIncomingRequest | null;
  onRequestHandled?: () => void;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const historyWrapRef = useRef<HTMLDivElement>(null);
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  const lastIncomingSigRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const adkBannerTitle = useAdkResumeReviewStore(s => s.bannerTitle);
  const adkShowReviewActions = useAdkResumeReviewStore(s => s.showReviewActions);
  const [adkReviewBusy, setAdkReviewBusy] = useState(false);

  const patchLastMainAssistantError = useCallback(() => {
    const errorMsg = "I'm having trouble connecting right now.";
    setMessages(prev => {
      for (let i = prev.length - 1; i >= 0; i--) {
        const m = prev[i];
        if (m.role === "model" && !m.isTopic && m.text === "") {
          const next = [...prev];
          next[i] = { ...m, text: errorMsg };
          return next;
        }
      }
      return prev;
    });
  }, [setMessages]);

  const patchTopicAssistantError = useCallback(
    (topicId: string, botMsgId: string) => {
      const errorMsg = "I'm having trouble connecting right now.";
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== topicId || !msg.isTopic) return msg;
          const updated = (msg.messages || []).map(sub => (sub.id === botMsgId ? { ...sub, text: errorMsg } : sub));
          return { ...msg, messages: updated };
        })
      );
    },
    [setMessages]
  );

  useEffect(() => {
    if (!incomingRequest) {
      lastIncomingSigRef.current = null;
      return;
    }
    if (!sessionReady) return;

    if (incomingRequest.type === "section_review") {
      const sig = `section_review:${incomingRequest.section}:${incomingRequest.requestKey}`;
      if (lastIncomingSigRef.current === sig) return;
      lastIncomingSigRef.current = sig;

      setTimeout(() => {
        setIsCollapsed(false);
      }, 0);

      const prompt = UNIBOT_SECTION_REVIEW_PROMPTS[incomingRequest.section];
      if (!prompt) {
        onRequestHandled?.();
        return;
      }
      void (async () => {
        try {
          if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
            onRequestHandled?.();
            return;
          }
          await sendMainMessage(prompt);
        } catch {
          patchLastMainAssistantError();
        } finally {
          onRequestHandled?.();
        }
      })();
      return;
    }

    const sig = `${incomingRequest.type}:${incomingRequest.text}`;
    if (lastIncomingSigRef.current === sig) return;
    lastIncomingSigRef.current = sig;

    setTimeout(() => {
      setIsCollapsed(false);
    }, 0);
    const topicId = newId("topic");

    const initialUserMsg: ChatMessage = {
      id: newId("u"),
      role: "user",
      text: `Please improve the following text for my resume:\n\n"${incomingRequest.text}"`,
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
      topicTitle: "Content Improvement",
      isExpanded: true,
      messages: [initialUserMsg, placeholderMsg],
    };

    setMessages(prev => [...prev, newTopic]);

    void (async () => {
      try {
        await sendTopicMessage(initialUserMsg.text, botMsgId);
      } catch {
        patchTopicAssistantError(topicId, botMsgId);
      }
    })();

    onRequestHandled?.();
  }, [
    incomingRequest,
    sessionReady,
    sendTopicMessage,
    sendMainMessage,
    setMessages,
    onRequestHandled,
    patchTopicAssistantError,
    patchLastMainAssistantError,
    userId,
    isAgentLoading,
    isLoadingHistory,
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCollapsed, adkBannerTitle, adkShowReviewActions]);

  useEffect(() => {
    if (!historyOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = historyWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [historyOpen]);

  const canSend = Boolean(userId && sessionReady && !isAgentLoading && !isLoadingHistory);

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
      useAdkResumeReviewStore.getState().clearReview();
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

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || !canSend) return;

    setInput("");

    try {
      await sendMainMessage(textToSend);
    } catch {
      patchLastMainAssistantError();
    }
  };

  const onNewChat = async () => {
    if (!canUseHistory) return;
    try {
      await handleCreateNewSession();
      await refreshSessions();
      setHistoryOpen(false);
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

    try {
      await sendTopicMessage(topicInput, botMsgId);
    } catch {
      patchTopicAssistantError(topicId, botMsgId);
    }
  };

  const toggleTopic = (id: string) => {
    setMessages(prev => prev.map(msg => (msg.id === id ? { ...msg, isExpanded: !msg.isExpanded } : msg)));
  };

  const deleteTopic = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
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
      </div>
    );
  }

  return (
    <div className="w-[280px] border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d0d0d] flex flex-col h-full transition-all duration-300 shadow-sm relative z-20">
      <div className="h-16 px-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Logo className="h-6 w-auto text-brand-600 dark:text-brand-400" />
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-[#0d0d0d] no-scrollbar">
        {!userId && <p className="text-[11px] text-slate-400 px-1">Sign in to chat with Unimad AI.</p>}
        {userId && !sessionReady && (
          <p className="text-[11px] text-slate-400 px-1">
            {sessionError ? `Assistant: ${sessionError}` : isLoadingHistory ? "Loading chat…" : "Connecting to assistant…"}
          </p>
        )}

        {messages.map(msg => {
          if (msg.isTopic) {
            return (
              <div key={msg.id} className="w-full pl-4 border-l-2 border-slate-100 ml-1 my-4 animate-in fade-in slide-in-from-bottom-2">
                <div
                  onClick={() => toggleTopic(msg.id)}
                  className="flex items-center justify-between cursor-pointer group py-2 select-none"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-brand-600" />
                    <span className="text-xs font-medium text-slate-500 group-hover:text-brand-600 transition-colors uppercase tracking-wide">
                      {msg.topicTitle}
                    </span>
                  </div>
                </div>

                {msg.isExpanded && (
                  <div className="mt-2">
                    <div className="space-y-4 mb-3">
                      {msg.messages?.map(subMsg => (
                        <div key={subMsg.id} className={`flex flex-col gap-1 ${subMsg.role === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`text-[13px] py-2 px-3 leading-relaxed ${
                              subMsg.role === "user"
                                ? "bg-slate-50 text-slate-800 rounded-2xl rounded-tr-sm"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {subMsg.text || <Loader2 size={14} className="animate-spin text-slate-400" />}
                          </div>
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
              <div
                className={`text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%]"
                    : "bg-transparent text-slate-600 dark:text-slate-300 px-1 max-w-full"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isAgentLoading && (
          <div className="flex flex-col gap-1 items-start pl-1">
            <div className="text-[13px] text-slate-400 flex items-center gap-2 px-1">
              <Loader2 size={14} className="animate-spin" />
              <span>{streamActivityLabel ?? "Thinking…"}</span>
            </div>
          </div>
        )}

        {adkBannerTitle ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141414] px-3 py-2.5 shadow-sm">
            <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{adkBannerTitle}</p>
            {adkShowReviewActions ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={adkReviewBusy || !sessionReady}
                  onClick={() => void handleAdkAccept()}
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
                  onClick={() => void handleAdkDiscard()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#161616] dark:text-slate-200 dark:hover:bg-white/5 disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-[#0d0d0d] border-t border-slate-100 dark:border-white/5">
        <div className="bg-white dark:bg-[#161616] p-0 relative">
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
            placeholder="Ask anything"
            rows={1}
            disabled={!canSend}
            className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 resize-none max-h-48 overflow-y-auto min-h-[48px] py-1 px-1 mb-2 disabled:opacity-50"
          />

          <div className="flex justify-between items-center pl-1">
            {/*
              Voice (mic) input — deferred. History control opens past chats (ADK sessions).
              <button type="button" ...><Mic size={18} /></button>
            */}
            <div className="relative" ref={historyWrapRef}>
              <button
                type="button"
                onClick={() => setHistoryOpen(o => !o)}
                disabled={!canUseHistory}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                title="Chat history"
                aria-expanded={historyOpen}
                aria-haspopup="listbox"
              >
                <History size={18} />
              </button>
              {historyOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-[220px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161616] shadow-lg z-30 py-1 text-left"
                  role="listbox"
                >
                  <div className="px-2 pb-1 border-b border-slate-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => void onNewChat()}
                      disabled={!canUseHistory || isAgentLoading}
                      className="w-full text-left text-[12px] font-medium py-2 px-2 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40"
                    >
                      New chat
                    </button>
                  </div>
                  <ul className="max-h-44 overflow-y-auto py-1">
                    {sessions.length === 0 && <li className="px-3 py-2 text-[11px] text-slate-400">No other chats yet</li>}
                    {sessions.map(s => {
                      const active = s.id === sessionId;
                      return (
                        <li key={s.id}>
                          <div
                            className={`group flex items-center gap-1 py-1 px-1 hover:bg-slate-50 dark:hover:bg-white/5 ${
                              active ? "bg-slate-100 dark:bg-white/10" : ""
                            }`}
                          >
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              onClick={() => {
                                handleSessionSwitch(s.id);
                                setHistoryOpen(false);
                              }}
                              className={`min-w-0 flex-1 text-left text-[12px] py-1 px-2 truncate ${
                                active ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {s.title ?? s.id.slice(0, 12)}
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setPendingDeleteSession({
                                  id: s.id,
                                  title: s.title ?? s.id.slice(0, 12),
                                });
                              }}
                              disabled={isAgentLoading}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-20"
                              title="Delete chat session"
                              aria-label={`Delete ${s.title ?? "session"}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || !canSend}
              className="w-8 h-8 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 font-medium">
          AI can make mistakes. Please double-check responses.
        </p>
      </div>

      {pendingDeleteSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Delete chat session?</h2>
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
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
