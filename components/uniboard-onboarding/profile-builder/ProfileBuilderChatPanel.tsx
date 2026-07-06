"use client";

import { useCallback, useEffect, useMemo, useLayoutEffect, useRef, useState } from "react";
import type { PersonalizationProfile } from "@/features/onboarding/types";
import { growTextareaToFit, resetTextareaHeight } from "@/utils/textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, History, Send } from "lucide-react";
import { useOnboardingProfileAdk, type OnboardingLoadingPhase } from "./useOnboardingProfileAdk";

type ProfileBuilderChatPanelProps = {
  preferredName: string;
  personalization?: PersonalizationProfile | null;
};

type ChatViewMode = "latest" | "history";

export default function ProfileBuilderChatPanel({ preferredName, personalization }: ProfileBuilderChatPanelProps) {
  const { messages, sendMessage, isLoading, loadingPhase, streamActivityLabel, initError } = useOnboardingProfileAdk({
    preferredName,
    personalization,
  });
  const [input, setInput] = useState("");
  const [manualViewMode, setManualViewMode] = useState<ChatViewMode>("latest");
  const [viewLockedToId, setViewLockedToId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visibleMessages = messages.filter(m => m.role !== "status" && m.text.trim());
  const assistantMessages = visibleMessages.filter(m => m.role === "assistant");
  const latestAssistant = assistantMessages[assistantMessages.length - 1];

  const viewMode = latestAssistant?.id && latestAssistant.id !== viewLockedToId ? "latest" : manualViewMode;

  const setViewMode = useCallback(
    (mode: ChatViewMode) => {
      setManualViewMode(mode);
      setViewLockedToId(latestAssistant?.id ?? null);
    },
    [latestAssistant?.id]
  );

  const historyMessages = useMemo(() => {
    if (!latestAssistant) return [];
    const latestIdx = visibleMessages.findIndex(m => m.id === latestAssistant.id);
    return latestIdx > 0 ? visibleMessages.slice(0, latestIdx) : [];
  }, [visibleMessages, latestAssistant]);

  const hasHistory = historyMessages.length > 0;

  useLayoutEffect(() => {
    if (inputRef.current) growTextareaToFit(inputRef.current);
  }, [input]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (inputRef.current) resetTextareaHeight(inputRef.current);
    await sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const canSend = Boolean(input.trim()) && !isLoading && !initError;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#F8F9FB]">
      <div className="shrink-0 border-b border-[rgba(12,15,26,0.06)] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0C0F1A]">Unibot</p>
            <p className="text-xs text-[#4A5568]">Build your profile together</p>
          </div>
          {hasHistory ? (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "latest" ? "history" : "latest")}
              className="shrink-0 rounded-full border border-[rgba(12,15,26,0.1)] bg-white p-2 text-[#4A5568] hover:bg-[#F8F9FB]"
              aria-label={viewMode === "latest" ? "Older conversation" : "View latest"}
              title={viewMode === "latest" ? "Older conversation" : "View latest"}
            >
              {viewMode === "latest" ? <History size={16} /> : <ChevronUp size={16} />}
            </button>
          ) : null}
        </div>
      </div>

      {initError ? (
        <p className="shrink-0 px-4 py-2 text-center text-sm text-red-600" role="alert">
          {initError}
        </p>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {viewMode === "history" && hasHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="scrollbar-on-hover absolute inset-0 overflow-y-auto px-4 py-6"
            >
              <div className="flex min-h-full flex-col justify-center">
                <div className="flex w-full flex-col gap-4">
                  {historyMessages.map(msg =>
                    msg.role === "user" ? (
                      <HistoryUserBubble key={msg.id} text={msg.text} />
                    ) : (
                      <HistoryAssistantBubble key={msg.id} text={msg.text} />
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="latest"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6"
            >
              {isLoading ? (
                <BreathingStatus label={streamActivityLabel ?? defaultLoadingLabel(loadingPhase)} />
              ) : (
                <FocusQuestion text={latestAssistant?.text ?? ""} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-[rgba(12,15,26,0.06)] bg-white p-4">
        <div className="flex items-end gap-1 rounded-[16px] border border-[rgba(12,15,26,0.12)] bg-white px-3 py-2 shadow-sm focus-within:border-[#346DE0] focus-within:ring-2 focus-within:ring-[#346DE0]/15">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              growTextareaToFit(e.target);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Type your answer…"
            disabled={Boolean(initError)}
            className="max-h-48 min-h-[44px] flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-[15px] leading-relaxed text-[#0C0F1A] placeholder:text-[#A9B4C2] focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            className="mb-1 shrink-0 p-2 text-[#4A5568] transition-colors hover:text-[#0C0F1A] disabled:cursor-not-allowed disabled:text-[#C5CDD8]"
            aria-label="Send"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#A9B4C2]">You can also edit fields on the right anytime</p>
      </div>
    </div>
  );
}

function defaultLoadingLabel(phase: OnboardingLoadingPhase): string {
  if (phase === "boot") return "Waking up Unibot…";
  return "Reading your answer…";
}

function FocusQuestion({ text }: { text: string }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center px-2 text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="text-[length:clamp(1rem,1.1vw+0.7rem,1.35rem)] font-medium leading-[1.5] tracking-[-0.01em] text-[#0C0F1A]"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function BreathingStatus({ label }: { label: string }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center px-2 text-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0.55, 1, 0.55], y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          }}
          className="text-[length:clamp(0.95rem,0.9vw+0.65rem,1.2rem)] font-medium leading-[1.5] text-[#4A5568]"
        >
          {label}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function HistoryUserBubble({ text }: { text: string }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-[13px] leading-relaxed text-slate-900">
        <span className="whitespace-pre-wrap">{text}</span>
      </div>
    </div>
  );
}

function HistoryAssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] px-1 text-[13px] leading-relaxed text-slate-600">
        <span className="whitespace-pre-wrap">{text}</span>
      </div>
    </div>
  );
}
