/**
 * Resume list entry ids (experience, education, projects, …).
 *
 * **Display order** is the array order in `resume.experience`, `resume.education`, etc.
 * Reordering in the editor splices those arrays — ids stay stable on each row.
 *
 * **Section order** (`sectionOrder`) only controls which *sections* appear (profile, experience, …),
 * not row order within a section.
 *
 * New rows use prefixed sequential ids (`exp_1`, `edu_2`, …) aligned with ADK resume tools.
 * Legacy timestamp ids (ms since epoch) and plain numeric education ids still work for lookups.
 */

export type ResumeEntryPrefix = "exp" | "edu" | "proj" | "cert" | "skill" | "skill_cat" | "custom" | "custom_item";

/** Millisecond timestamps used by older editor builds — not used when allocating the next id. */
export function isLegacyTimestampEntryId(id: string): boolean {
  const trimmed = id.trim();
  return /^\d{10,}$/.test(trimmed);
}

function parsePrefixedIndex(id: string, prefix: ResumeEntryPrefix): number | null {
  const trimmed = id.trim();
  const match = new RegExp(`^${prefix}_(\\d+)$`).exec(trimmed);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function parseLegacyEducationIndex(id: string): number | null {
  const trimmed = id.trim();
  if (trimmed.startsWith("edu_")) {
    const n = Number.parseInt(trimmed.slice(4), 10);
    return Number.isFinite(n) ? n : null;
  }
  if (/^\d+$/.test(trimmed) && trimmed.length <= 6 && !isLegacyTimestampEntryId(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function maxIndexForPrefix(existingIds: readonly string[], prefix: ResumeEntryPrefix): number {
  let max = 0;
  for (const raw of existingIds) {
    const prefixed = parsePrefixedIndex(raw, prefix);
    if (prefixed != null) {
      max = Math.max(max, prefixed);
      continue;
    }
    if (prefix === "edu") {
      const legacy = parseLegacyEducationIndex(raw);
      if (legacy != null) max = Math.max(max, legacy);
    }
  }
  return max;
}

/** Allocate the next stable id for a new row in a resume list section. */
export function nextResumeEntryId(existingIds: readonly string[], prefix: ResumeEntryPrefix): string {
  return `${prefix}_${maxIndexForPrefix(existingIds, prefix) + 1}`;
}
