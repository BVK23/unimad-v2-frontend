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

export function toScheduleDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseScheduleDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

function startOfLocalDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isScheduleDateSelectable(date: Date, access: LinkedInPublishAccess): boolean {
  if (!access.canSchedule) return false;
  const day = startOfLocalDay(date);
  const today = startOfLocalDay(new Date());
  if (day < today) return false;
  if (access.sessionEndsAt) {
    const endsAt = new Date(access.sessionEndsAt);
    if (!Number.isNaN(endsAt.getTime()) && day > startOfLocalDay(endsAt)) {
      return false;
    }
  }
  return true;
}

export function scheduleTimeBoundsForDate(dateKey: string, access: LinkedInPublishAccess): { min?: string; max?: string } {
  if (!dateKey) return {};
  const todayKey = toScheduleDateKey(new Date());
  const bounds: { min?: string; max?: string } = {};

  if (dateKey === todayKey) {
    const now = new Date();
    let hour = now.getHours();
    let minute = Math.ceil(now.getMinutes() / 15) * 15;
    if (minute >= 60) {
      hour += 1;
      minute = 0;
    }
    bounds.min = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  if (access.sessionEndsAt) {
    const endsAt = new Date(access.sessionEndsAt);
    if (!Number.isNaN(endsAt.getTime()) && toScheduleDateKey(endsAt) === dateKey) {
      const endMinute = Math.floor(endsAt.getMinutes() / 15) * 15;
      bounds.max = `${String(endsAt.getHours()).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
    }
  }

  return bounds;
}

export function isScheduleTimeSelectable(dateKey: string, time: string, access: LinkedInPublishAccess): boolean {
  if (!dateKey || !time) return false;
  const parsed = parseScheduleDateTime(dateKey, time);
  if (!parsed) return false;
  if (!isScheduleDateSelectable(parsed, access)) return false;

  const todayKey = toScheduleDateKey(new Date());
  if (dateKey === todayKey && parsed.getTime() <= Date.now()) {
    return false;
  }

  const { min, max } = scheduleTimeBoundsForDate(dateKey, access);
  if (min && time < min) return false;
  if (max && time > max) return false;
  return true;
}

export const SCHEDULE_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});
