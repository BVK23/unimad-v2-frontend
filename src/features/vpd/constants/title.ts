/** Soft cap for user-facing VPD titles (Role @ Company). DB allows more as a hard ceiling. */
export const VPD_TITLE_MAX_CHARS = 120;

/** Hard ceiling matching Django `VPD.title` max_length after migration. */
export const VPD_TITLE_DB_MAX_CHARS = 500;

export function clampVpdTitle(raw: string, max = VPD_TITLE_MAX_CHARS): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}
