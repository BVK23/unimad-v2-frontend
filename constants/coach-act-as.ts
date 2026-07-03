/** Coach "view student profile" — cookie + request header contract (UserProfile.id). */

export const COACH_ACT_AS_COOKIE = "_uas";
export const COACH_ACT_AS_NAME_COOKIE = "_uasn";
export const COACH_ACT_AS_HEADER = "X-Unicoach-As-Student";

export type CoachActAsSession = {
  studentProfileId: string;
  studentDisplayName: string;
};

export function coachActAsDisplayLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Student profile";
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return `${first}'s Profile`;
}
