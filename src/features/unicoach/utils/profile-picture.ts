type ProfilePictureSources = {
  direct?: string | null;
  unimad?: string | null;
  linkedin?: string | null;
  google?: string | null;
};

/** Resolve the best available profile picture URL from known source fields. */
export function resolveProfilePicture(sources: ProfilePictureSources): string | null {
  for (const candidate of [sources.direct, sources.unimad, sources.linkedin, sources.google]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}
