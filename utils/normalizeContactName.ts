const PLACEHOLDER_CONTACT_NAMES = new Set(["hiring manager", "connection"]);

/** Returns a display-ready contact name, or undefined when empty or a generic placeholder. */
export function normalizeContactNameForDisplay(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (PLACEHOLDER_CONTACT_NAMES.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}
