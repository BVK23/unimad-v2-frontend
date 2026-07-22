"use client";

import { useCallback, useEffect, useState } from "react";
import { FormattedAgentMessage } from "@/components/chat/FormattedAgentMessage";
import { fetchUnibotLegacyHistory, fetchUnibotLegacyHomeChats } from "@/features/unibot-legacy/server-actions/unibot-legacy-actions";
import type { UnibotLegacyChatMessage, UnibotLegacyHomeChat } from "@/features/unibot-legacy/types";
import Link from "next/link";

export function UnibotLegacyChat() {
  const [chats, setChats] = useState<UnibotLegacyHomeChat[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [messages, setMessages] = useState<UnibotLegacyChatMessage[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError(null);
    fetchUnibotLegacyHomeChats()
      .then(rows => {
        if (cancelled) return;
        // Newest first for the sidebar.
        const ordered = [...rows].reverse();
        setChats(ordered);
        if (ordered.length > 0) {
          setSelectedSection(ordered[0].section);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setListError(err instanceof Error ? err.message : "Failed to load chats");
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadHistory = useCallback(async (section: string) => {
    setLoadingHistory(true);
    setHistoryError(null);
    setMessages([]);
    try {
      const history = await fetchUnibotLegacyHistory(section);
      setMessages(history);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    void loadHistory(selectedSection);
  }, [selectedSection, loadHistory]);

  const selectedChat = chats.find(c => c.section === selectedSection) ?? null;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[#f7f6f3] text-slate-900">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Legacy access</p>
          <h1 className="text-base font-semibold text-slate-900">Unibot home chat history</h1>
        </div>
        <Link
          href="/uniboard"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Back to Uniboard
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full max-w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Home chats</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <p className="px-2 py-3 text-sm text-slate-500">Loading…</p>
            ) : listError ? (
              <p className="px-2 py-3 text-sm text-red-600">{listError}</p>
            ) : chats.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">No legacy home chats found.</p>
            ) : (
              <ul className="space-y-1">
                {chats.map(chat => {
                  const active = chat.section === selectedSection;
                  return (
                    <li key={chat.id || chat.section}>
                      <button
                        type="button"
                        onClick={() => setSelectedSection(chat.section)}
                        className={
                          active
                            ? "w-full rounded-lg bg-slate-900 px-3 py-2 text-left text-sm text-white"
                            : "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                        }
                      >
                        <span className="line-clamp-2 font-medium">{chat.title || "Untitled chat"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {selectedChat?.title || (selectedSection ? "Chat" : "Select a chat")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Read-only view of your previous Unibot home conversations.</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!selectedSection ? (
              <p className="text-sm text-slate-500">Select a home chat from the left.</p>
            ) : loadingHistory ? (
              <p className="text-sm text-slate-500">Loading messages…</p>
            ) : historyError ? (
              <p className="text-sm text-red-600">{historyError}</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages in this chat.</p>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {messages.map((msg, idx) => {
                  const isUser = msg.type === "user";
                  return (
                    <div key={`${msg.message_id ?? idx}-${msg.type}`} className={isUser ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          isUser
                            ? "max-w-[85%] rounded-2xl bg-slate-900 px-4 py-2.5 text-[13px] leading-relaxed text-white"
                            : "max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm"
                        }
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        ) : (
                          <FormattedAgentMessage content={msg.message || ""} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
