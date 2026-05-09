/**
 * Stable id for ADK user_id / session paths. Prefer Django username, then email,
 * then a slug from display name (last resort).
 */
export type AdkUserProfile = {
  username?: string;
  email?: string;
  name?: string;
  firstName?: string;
};

export function computeAdkUserId(profile: AdkUserProfile | null | undefined): string {
  if (!profile) return "";

  const u = profile.username?.trim();
  if (u) return u;

  const email = profile.email?.trim();
  if (email) return email;

  const display = [profile.firstName, profile.name].filter(Boolean).join(" ").trim();
  if (display) {
    return display
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_@.-]/g, "")
      .slice(0, 128);
  }

  return "";
}
