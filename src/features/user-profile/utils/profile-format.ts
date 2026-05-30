const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseYearMonth(dateString: unknown): Date | "Present" | null {
  if (!dateString || typeof dateString !== "string" || dateString.trim() === "") return null;
  if (dateString === "Present") return "Present";

  const raw = dateString.trim();
  let year: number | undefined;
  let month: number | undefined;

  if (raw.includes("-")) {
    const parts = raw.split("-").map(p => p.trim());
    if (parts[0]?.length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
    } else {
      month = Number(parts[0]);
      year = Number(parts[1]);
    }
  } else if (raw.includes("/")) {
    const parts = raw.split("/").map(p => p.trim());
    if (parts[0]?.length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
    } else {
      month = Number(parts[0]);
      year = Number(parts[1]);
    }
  }

  if (!year || !month || Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
  const date = new Date(year, month - 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatYearMonth(dateString: unknown): string {
  if (dateString === "Present") return "Present";
  const parsed = parseYearMonth(dateString);
  if (!parsed || parsed === "Present") return "";
  return `${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

export function formatDateRange(start: unknown, end: unknown): string {
  const s = formatYearMonth(start);
  const e = end === "Present" ? "Present" : formatYearMonth(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
}

export function descriptionsStringToArray(descriptionsString: string): string[] {
  if (!descriptionsString?.trim()) return [];
  return descriptionsString
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => (line.startsWith("-") ? line.replace(/^-\s*/, "") : line))
    .filter(Boolean);
}

export function descriptionsArrayToString(descriptions: unknown): string {
  if (!Array.isArray(descriptions) || descriptions.length === 0) return "";
  return descriptions.map(d => `- ${String(d)}`).join("\n");
}

/** Normalize HTML month input (YYYY-MM) for API storage. */
export function monthInputToStored(value: string): string {
  return value.trim();
}
