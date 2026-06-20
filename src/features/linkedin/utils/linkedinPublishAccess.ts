import type { ProfileData } from "@/features/user-profile/types";

export type LinkedInPublishBlockReason = "connect" | "reconnect";

export type LinkedInPublishAccess = {
  canPost: boolean;
  canSchedule: boolean;
  sessionEndsAt: string | null;
  blockReason: LinkedInPublishBlockReason | null;
};

export function resolveLinkedInPublishAccess(
  profile: Pick<ProfileData, "has_linkedin" | "linkedin_can_post" | "linkedin_can_schedule" | "linkedin_session_ends_at"> | null | undefined
): LinkedInPublishAccess {
  const hasLinkedIn = Boolean(profile?.has_linkedin);
  const canPost = Boolean(profile?.linkedin_can_post);
  const canSchedule = Boolean(profile?.linkedin_can_schedule);
  const sessionEndsAt = profile?.linkedin_session_ends_at ?? null;

  let blockReason: LinkedInPublishBlockReason | null = null;
  if (!canPost) {
    blockReason = hasLinkedIn ? "reconnect" : "connect";
  }

  return { canPost, canSchedule, sessionEndsAt, blockReason };
}

export function buildLinkedInConnectUrl(userId?: number, returnSegment = "studio"): string {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "");
  if (userId) {
    return `${base}/linkedin-login?redirect=${encodeURIComponent(returnSegment)}&link=true&user_id=${userId}`;
  }
  return `${base}/linkedin-login?redirect=${encodeURIComponent(returnSegment)}`;
}

export function parseScheduleDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isLinkedInScheduleDateAllowed(scheduledAt: Date, access: LinkedInPublishAccess): boolean {
  if (!access.canSchedule) return false;
  if (!access.sessionEndsAt) return true;
  const endsAt = new Date(access.sessionEndsAt);
  return !Number.isNaN(endsAt.getTime()) && scheduledAt.getTime() <= endsAt.getTime();
}

export function formatSessionEndsDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function sessionEndsAtInputMax(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split("T")[0];
}
