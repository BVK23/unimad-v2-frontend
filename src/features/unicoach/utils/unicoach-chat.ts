import type { JourneyChatPeers, UnicoachCommentRow, UnicoachProfileInfo } from "../types";

export type ChatSenderRole = "student" | "coach";

export type ChatSenderInfo = {
  id: number;
  name: string;
  picture: string | null;
  role: ChatSenderRole;
};

export type PreparedChatMessage = UnicoachCommentRow & {
  sender: ChatSenderInfo;
  showAvatar: boolean;
  showDateSeparator: boolean;
};

export type CoachAvatarChip = {
  id: number;
  name: string;
  picture: string | null;
};

export function sumUnreadCounts(counts?: Record<string, number> | null): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}

export function formatChatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatChatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isDifferentDay(a: string, b: string): boolean {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}

export function resolveChatSender(
  senderId: number,
  studentPeerId: number | null | undefined,
  profile: UnicoachProfileInfo | undefined,
  chatPeers: JourneyChatPeers | undefined,
  studentNameFallback?: string | null
): ChatSenderInfo {
  const isStudent = studentPeerId != null && senderId === studentPeerId;

  if (isStudent) {
    const fromUser = profile?.User?.[String(senderId)];
    const fromPeer = chatPeers?.student;
    return {
      id: senderId,
      name: fromUser?.name || fromPeer?.name || studentNameFallback || "Student",
      picture: fromUser?.profile_picture ?? fromPeer?.profile_picture ?? null,
      role: "student",
    };
  }

  const fromCoach = profile?.coaches?.[String(senderId)];
  const fromPeerCoach = chatPeers?.coach?.id === senderId ? chatPeers.coach : null;
  return {
    id: senderId,
    name: fromCoach?.name || fromPeerCoach?.name || "Coach",
    picture: fromCoach?.profile_picture ?? fromPeerCoach?.profile_picture ?? null,
    role: "coach",
  };
}

export function prepareChatMessages(
  rows: UnicoachCommentRow[],
  studentPeerId: number | null | undefined,
  profile: UnicoachProfileInfo | undefined,
  chatPeers: JourneyChatPeers | undefined,
  studentNameFallback?: string | null
): PreparedChatMessage[] {
  const chronological = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return chronological.map((row, index) => {
    const prev = index > 0 ? chronological[index - 1] : null;
    const sender = resolveChatSender(row.sender_id, studentPeerId, profile, chatPeers, studentNameFallback);
    const showDateSeparator = !prev || isDifferentDay(prev.created_at, row.created_at);
    const showAvatar = !prev || prev.sender_id !== row.sender_id || showDateSeparator;

    return {
      ...row,
      sender,
      showAvatar,
      showDateSeparator,
    };
  });
}

export function listDefaultCoaches(profile: UnicoachProfileInfo | undefined, chatPeers: JourneyChatPeers | undefined): CoachAvatarChip[] {
  const chips: CoachAvatarChip[] = [];
  const seen = new Set<number>();

  if (chatPeers?.coach?.id) {
    seen.add(chatPeers.coach.id);
    chips.push({
      id: chatPeers.coach.id,
      name: chatPeers.coach.name || "Coach",
      picture: chatPeers.coach.profile_picture ?? null,
    });
  }

  if (profile?.coaches) {
    for (const [id, coach] of Object.entries(profile.coaches)) {
      const numericId = Number(id);
      if (!Number.isFinite(numericId) || seen.has(numericId)) continue;
      seen.add(numericId);
      chips.push({
        id: numericId,
        name: coach.name || "Coach",
        picture: coach.profile_picture ?? null,
      });
    }
  }

  return chips;
}

/** Coaches who have sent messages, most-recent sender first. Falls back to assigned coaches when empty. */
export function coachAvatarsForFab(
  rows: UnicoachCommentRow[],
  studentPeerId: number | null | undefined,
  profile: UnicoachProfileInfo | undefined,
  chatPeers: JourneyChatPeers | undefined
): CoachAvatarChip[] {
  const newestFirst = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const ordered: CoachAvatarChip[] = [];
  const seen = new Set<number>();

  for (const row of newestFirst) {
    if (studentPeerId != null && row.sender_id === studentPeerId) continue;
    if (seen.has(row.sender_id)) continue;
    seen.add(row.sender_id);
    const sender = resolveChatSender(row.sender_id, studentPeerId, profile, chatPeers);
    ordered.push({ id: sender.id, name: sender.name, picture: sender.picture });
  }

  if (ordered.length > 0) return ordered;
  return listDefaultCoaches(profile, chatPeers);
}

export function dicebearFallback(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}
