/** Persisted placeholder until the user's first typed message gets a generated title. */
export const UNTITLED_THREAD_TITLE = "Untitled Thread";

/** Sidebar label for main sessions that still use the placeholder title. */
export const NEW_THREAD_DISPLAY_TITLE = "New Thread";

/** Backend date fallback when LLM title generation fails — e.g. Convo 24-06-26 */
export const CONVO_DATE_TITLE_RE = /^Convo \d{2}-\d{2}-\d{2}( \(\d+\))?$/;

const UNTITLED_THREAD_ALIASES = new Set([
  UNTITLED_THREAD_TITLE,
  "New Untitled Thread",
  "Unitled Thread",
  NEW_THREAD_DISPLAY_TITLE,
  "New chat",
  "Untitled chat",
]);

export function isUntitledMainSessionTitle(title: string | null | undefined): boolean {
  const t = title?.trim();
  return !t || UNTITLED_THREAD_ALIASES.has(t);
}

export function isConvoDateFallbackTitle(title: string | null | undefined): boolean {
  const t = title?.trim();
  return Boolean(t && CONVO_DATE_TITLE_RE.test(t));
}

/** Untitled or generic Convo date — eligible for (re)title on the next user message. */
export function mainSessionNeedsTitleGeneration(title: string | null | undefined): boolean {
  return isUntitledMainSessionTitle(title) || isConvoDateFallbackTitle(title);
}

export function mainSessionDisplayTitle(title: string | null | undefined): string {
  return isUntitledMainSessionTitle(title) ? NEW_THREAD_DISPLAY_TITLE : (title?.trim() ?? NEW_THREAD_DISPLAY_TITLE);
}
