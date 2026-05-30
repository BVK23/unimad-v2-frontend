import type { ProfileData } from "../types";

export function resolveProfilePictureFromProfile(
  profile: Pick<ProfileData, "profilePictureUrl" | "profilePictureSources"> | null | undefined
): string | null {
  if (!profile) return null;
  const direct = profile.profilePictureUrl?.trim();
  if (direct) return direct;
  const src = profile.profilePictureSources;
  if (!src) return null;
  for (const candidate of [src.unimad, src.google, src.linkedin]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}
