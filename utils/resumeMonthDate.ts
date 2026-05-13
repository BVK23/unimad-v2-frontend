/**
 * Canonical resume month storage is YYYY-MM (e.g. 2021-09).
 * Agents or legacy data may send "Oct 2020" — normalize when possible.
 */

export function normalizeResumeMonthStorage(input: string | undefined | null): string | null {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === "present" || lower === "current" || lower === "now") return s;
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return null;
}

/** Sort order for YYYY-MM strings; null if either value is not normalizeable. */
export function compareResumeMonthDates(a: string, b: string): number | null {
  const na = normalizeResumeMonthStorage(a);
  const nb = normalizeResumeMonthStorage(b);
  if (na === null || nb === null) return null;
  if (na.localeCompare(nb) < 0) return -1;
  if (na.localeCompare(nb) > 0) return 1;
  return 0;
}
