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

/** Production primary coach — front of the student chat FAB until another coach messages. */
export const PRIMARY_COACH_EMAIL = "sharath150697@gmail.com";

function coachChipFromProfile(id: number, coach: { name?: string | null; profile_picture?: string | null } | undefined): CoachAvatarChip {
  return {
    id,
    name: coach?.name || "Coach",
    picture: coach?.profile_picture ?? null,
  };
}

function primaryCoachId(profile: UnicoachProfileInfo | undefined, chatPeers: JourneyChatPeers | undefined): number | null {
  if (profile?.coaches) {
    for (const [id, coach] of Object.entries(profile.coaches)) {
      const email = coach.email?.trim().toLowerCase();
      if (email === PRIMARY_COACH_EMAIL) {
        const numericId = Number(id);
        if (Number.isFinite(numericId)) return numericId;
      }
    }
  }
  return chatPeers?.coach?.id ?? null;
}

/** Assigned coaches for the FAB. Primary coach (Sharath, else journey chat peer) first. */
export function listDefaultCoaches(profile: UnicoachProfileInfo | undefined, chatPeers: JourneyChatPeers | undefined): CoachAvatarChip[] {
  const chips: CoachAvatarChip[] = [];
  const seen = new Set<number>();
  const preferredId = primaryCoachId(profile, chatPeers);

  const push = (id: number, coach?: { name?: string | null; profile_picture?: string | null }) => {
    if (!Number.isFinite(id) || seen.has(id)) return;
    seen.add(id);
    chips.push(coachChipFromProfile(id, coach));
  };

  if (preferredId != null) {
    const fromProfile = profile?.coaches?.[String(preferredId)];
    const fromPeer = chatPeers?.coach?.id === preferredId ? chatPeers.coach : null;
    push(preferredId, fromProfile ?? fromPeer ?? undefined);
  }

  if (profile?.coaches) {
    for (const [id, coach] of Object.entries(profile.coaches)) {
      push(Number(id), coach);
    }
  }

  if (chatPeers?.coach?.id) {
    push(chatPeers.coach.id, chatPeers.coach);
  }

  return chips;
}

/**
 * Student chat FAB avatars: all assigned coaches in one stack.
 * Front = most recent coach messenger; otherwise primary coach (Sharath) first.
 */
export function coachAvatarsForFab(
  rows: UnicoachCommentRow[],
  studentPeerId: number | null | undefined,
  profile: UnicoachProfileInfo | undefined,
  chatPeers: JourneyChatPeers | undefined
): CoachAvatarChip[] {
  const assigned = listDefaultCoaches(profile, chatPeers);
  const newestFirst = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const byRecency: CoachAvatarChip[] = [];
  const seen = new Set<number>();

  for (const row of newestFirst) {
    if (studentPeerId != null && row.sender_id === studentPeerId) continue;
    if (seen.has(row.sender_id)) continue;
    const sender = resolveChatSender(row.sender_id, studentPeerId, profile, chatPeers);
    if (sender.role !== "coach") continue;
    seen.add(row.sender_id);
    byRecency.push({ id: sender.id, name: sender.name, picture: sender.picture });
  }

  if (byRecency.length === 0) return assigned;

  const ordered = [...byRecency];
  for (const coach of assigned) {
    if (seen.has(coach.id)) continue;
    seen.add(coach.id);
    ordered.push(coach);
  }
  return ordered;
}

export function dicebearFallback(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`;
}
