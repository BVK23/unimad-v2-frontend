"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useDeleteCoachMessageMutation,
  useMarkCoachMessagesReadMutation,
  useSendCoachMessageMutation,
} from "@/features/unicoach/hooks/use-uniboard-unicoach";
import type {
  JourneyChatPeers,
  JourneyTargetProfile,
  UnicoachCommentRow,
  UnicoachInitResponse,
  UnicoachProfileInfo,
} from "@/features/unicoach/types";
import { parseCoachData } from "@/features/unicoach/types";
import { resolveProfilePicture } from "@/features/unicoach/utils/profile-picture";
import {
  coachAvatarsForFab,
  dicebearFallback,
  formatChatDateSeparator,
  formatChatTime,
  prepareChatMessages,
  sumUnreadCounts,
  type CoachAvatarChip,
  type PreparedChatMessage,
} from "@/features/unicoach/utils/unicoach-chat";
import { Minimize2, SendHorizontal, Trash2 } from "lucide-react";

export type UnicoachFloatingChatProps = {
  enabled: boolean;
  commentSection: string;
  journeyUserId: string | null;
  isCoachView: boolean;
  viewerProfileId: number | null;
  studentPeerId: number | null;
  chatPeers: JourneyChatPeers | undefined;
  profile: UnicoachProfileInfo | undefined;
  init: UnicoachInitResponse | undefined;
  journeyTargetProfile: JourneyTargetProfile | undefined;
  comments: UnicoachCommentRow[];
};

function ChatAvatar({
  chip,
  size = 40,
  className = "",
}: {
  chip: { name: string; picture: string | null };
  size?: number;
  className?: string;
}) {
  const src = chip.picture?.trim() || dicebearFallback(chip.name || "coach");
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external avatars
    <img src={src} alt="" width={size} height={size} className={`h-full w-full object-cover ${className}`} referrerPolicy="no-referrer" />
  );
}

function CoachAvatarStack({
  coaches,
  size = 40,
  hoverReveal = false,
}: {
  coaches: CoachAvatarChip[];
  size?: number;
  hoverReveal?: boolean;
}) {
  const [main, ...behind] = coaches;
  if (!main) return null;

  const mainSize = size;
  const behindSize = Math.round(size * 0.82);
  const overlap = Math.round(behindSize * 0.38);
  /** Furthest-behind first so left → right reads as stack into the front coach. */
  const peekBehind = behind.slice(0, 2).reverse();
  const peekCount = peekBehind.length;
  const containerWidth = mainSize + peekCount * overlap;

  return (
    <div className="group/stack relative shrink-0" style={{ width: containerWidth, height: mainSize }}>
      {hoverReveal && behind.length > 0 ? (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 flex-col-reverse items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover/stack:opacity-100">
          {behind.map(coach => (
            <span
              key={coach.id}
              className="overflow-hidden rounded-full border-2 border-white shadow-md dark:border-slate-800"
              style={{ width: behindSize, height: behindSize }}
              title={coach.name}
            >
              <ChatAvatar chip={coach} size={behindSize} />
            </span>
          ))}
        </div>
      ) : null}

      {peekBehind.map((coach, index) => (
        <span
          key={coach.id}
          className="absolute overflow-hidden rounded-full border-2 border-white shadow-sm dark:border-slate-700"
          style={{
            width: behindSize,
            height: behindSize,
            left: index * overlap,
            top: (mainSize - behindSize) / 2,
            zIndex: index + 1,
          }}
          title={coach.name}
        >
          <ChatAvatar chip={coach} size={behindSize} />
        </span>
      ))}

      <span
        className="absolute overflow-hidden rounded-full border-2 border-white shadow-md dark:border-slate-700"
        style={{
          width: mainSize,
          height: mainSize,
          left: peekCount * overlap,
          top: 0,
          zIndex: peekCount + 1,
        }}
        title={main.name}
      >
        <ChatAvatar chip={main} size={mainSize} />
      </span>
    </div>
  );
}

function ChatDateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center py-2">
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
      <span className="mx-3 rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {label}
      </span>
      <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
    </div>
  );
}

function ChatMessageRow({
  msg,
  alignEnd,
  viewerProfileId,
  activeTimestampId,
  onToggleTimestamp,
  onDelete,
  isDeleting,
}: {
  msg: PreparedChatMessage;
  alignEnd: boolean;
  viewerProfileId: number | null;
  activeTimestampId: number | null;
  onToggleTimestamp: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const canDelete = viewerProfileId != null && msg.sender_id === viewerProfileId;
  const showTime = activeTimestampId === msg.id;
  const tailCorner = alignEnd ? "rounded-br-md" : "rounded-bl-md";
  const bubbleClass =
    msg.sender.role === "coach" ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" : "bg-brand-600 text-white";

  return (
    <div>
      {msg.showDateSeparator ? <ChatDateDivider label={formatChatDateSeparator(msg.created_at)} /> : null}
      <div className={`flex items-end gap-1.5 ${alignEnd ? "justify-end" : "justify-start"} ${msg.showAvatar ? "mt-2" : "mt-0.5"}`}>
        {!alignEnd && msg.showAvatar ? (
          <div
            className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
            title={msg.sender.name}
          >
            <ChatAvatar chip={msg.sender} size={24} />
          </div>
        ) : !alignEnd ? (
          <div className="h-6 w-6 shrink-0" aria-hidden />
        ) : null}

        <div className={`group max-w-[78%] ${alignEnd ? "items-end" : "items-start"}`}>
          <button
            type="button"
            onClick={() => onToggleTimestamp(msg.id)}
            className={`block w-full rounded-2xl px-3 py-2 text-left text-xs ${tailCorner} ${bubbleClass}`}
          >
            {msg.message}
            {msg.is_edited ? <span className="ml-1.5 text-[10px] opacity-70">(edited)</span> : null}
          </button>
          {showTime ? (
            <p className={`mt-0.5 text-[10px] text-slate-400 ${alignEnd ? "text-right" : "text-left"}`}>{formatChatTime(msg.created_at)}</p>
          ) : null}
          {canDelete ? (
            <div className={`mt-0.5 flex ${alignEnd ? "justify-end" : "justify-start"}`}>
              <button
                type="button"
                onClick={() => onDelete(msg.id)}
                disabled={isDeleting}
                className="rounded p-0.5 text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                aria-label="Delete message"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ) : null}
        </div>

        {alignEnd && msg.showAvatar ? (
          <div
            className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
            title={msg.sender.name}
          >
            <ChatAvatar chip={msg.sender} size={24} />
          </div>
        ) : alignEnd ? (
          <div className="h-6 w-6 shrink-0" aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

export const UnicoachFloatingChat: React.FC<UnicoachFloatingChatProps> = ({
  enabled,
  commentSection,
  journeyUserId,
  isCoachView,
  viewerProfileId,
  studentPeerId,
  chatPeers,
  profile,
  init,
  journeyTargetProfile,
  comments,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [activeTimestampId, setActiveTimestampId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const readObserverRef = useRef<IntersectionObserver | null>(null);
  const readSentinelRef = useRef<HTMLDivElement | null>(null);

  const sendMutation = useSendCoachMessageMutation(commentSection, journeyUserId);
  const deleteMutation = useDeleteCoachMessageMutation(commentSection, journeyUserId);
  const markReadMutation = useMarkCoachMessagesReadMutation();

  const preparedMessages = useMemo(
    () => prepareChatMessages(comments, studentPeerId, profile, chatPeers, journeyTargetProfile?.name),
    [comments, studentPeerId, profile, chatPeers, journeyTargetProfile?.name]
  );

  const rawServerUnreadCount = useMemo(() => {
    if (isCoachView && init) {
      const coach = parseCoachData(init);
      const student = coach?.assigned_users.find(u => String(u.id) === journeyUserId);
      return sumUnreadCounts(student?.unread_counts);
    }
    return sumUnreadCounts(init?.user_unread_counts);
  }, [isCoachView, init, journeyUserId]);

  const badgeUnreadCount = open ? 0 : rawServerUnreadCount;

  const coachFabAvatars = useMemo(
    () => coachAvatarsForFab(comments, studentPeerId, profile, chatPeers),
    [comments, studentPeerId, profile, chatPeers]
  );

  const studentFabPicture = useMemo(() => {
    const direct = chatPeers?.student?.profile_picture?.trim() || journeyTargetProfile?.profile_picture?.trim() || null;
    return resolveProfilePicture({ direct }) ?? dicebearFallback(journeyTargetProfile?.name || "student");
  }, [chatPeers?.student?.profile_picture, journeyTargetProfile?.profile_picture, journeyTargetProfile?.name]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [open, preparedMessages.length, scrollToBottom]);

  const markAsRead = useCallback(() => {
    if (!commentSection || rawServerUnreadCount <= 0) return;
    markReadMutation.mutate({ sectionName: commentSection, userId: journeyUserId });
  }, [commentSection, journeyUserId, markReadMutation, rawServerUnreadCount]);

  const setReadSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (readObserverRef.current) {
        readObserverRef.current.disconnect();
        readObserverRef.current = null;
      }
      readSentinelRef.current = node;

      if (!node || !open || rawServerUnreadCount <= 0) return;

      const observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting) {
            markAsRead();
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(node);
      readObserverRef.current = observer;
    },
    [open, rawServerUnreadCount, markAsRead]
  );

  useEffect(() => {
    return () => {
      readObserverRef.current?.disconnect();
    };
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setActiveTimestampId(null);
  };

  const handleSend = async () => {
    if (!draft.trim()) return;
    try {
      await sendMutation.mutateAsync(draft.trim());
      setDraft("");
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteMutation.mutateAsync(commentId);
    } catch {
      /* ignore */
    }
  };

  if (!enabled) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800 shadow-lg transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a1a1a] dark:text-slate-100 dark:hover:bg-slate-900 md:bottom-6 md:right-6"
        >
          {isCoachView ? (
            <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={studentFabPicture}
                alt=""
                className="h-full w-full object-cover"
                width={40}
                height={40}
                referrerPolicy="no-referrer"
              />
            </span>
          ) : (
            <CoachAvatarStack coaches={coachFabAvatars} size={40} hoverReveal />
          )}
          <span>Chat</span>
          {badgeUnreadCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {badgeUnreadCount > 9 ? "9+" : badgeUnreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[min(520px,72vh)] max-h-[72vh] flex-col border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-[#141414] md:inset-x-auto md:bottom-6 md:right-6 md:h-[480px] md:max-h-[520px] md:w-[380px] md:rounded-2xl md:border md:shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-2">
              {isCoachView ? (
                <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white dark:border-[#141414]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={studentFabPicture}
                    alt=""
                    className="h-full w-full object-cover"
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                  />
                </span>
              ) : (
                <CoachAvatarStack coaches={coachFabAvatars} size={32} />
              )}
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{isCoachView ? "Student chat" : "Coach chat"}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Minimize chat"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="scrollbar-on-hover min-h-0 flex-1 overflow-y-auto px-3 py-2">
            {preparedMessages.map(msg => {
              const alignEnd = (isCoachView && msg.sender.role === "coach") || (!isCoachView && msg.sender.role === "student");
              return (
                <ChatMessageRow
                  key={msg.id}
                  msg={msg}
                  alignEnd={alignEnd}
                  viewerProfileId={viewerProfileId}
                  activeTimestampId={activeTimestampId}
                  onToggleTimestamp={id => setActiveTimestampId(prev => (prev === id ? null : id))}
                  onDelete={id => void handleDelete(id)}
                  isDeleting={deleteMutation.isPending}
                />
              );
            })}
            <div ref={setReadSentinelRef} className="h-px w-full" aria-hidden />
          </div>

          <div className="border-t border-slate-100 p-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={isCoachView ? "Message as coach…" : "Message your coach…"}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sendMutation.isPending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                aria-label="Send message"
              >
                <SendHorizontal size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
