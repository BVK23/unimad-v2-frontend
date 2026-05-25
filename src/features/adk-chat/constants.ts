/** Persisted placeholder until the user's first typed message gets a generated title. */
export const UNTITLED_THREAD_TITLE = "Untitled Thread";

/** Sidebar label for main sessions that still use the placeholder title. */
export const NEW_THREAD_DISPLAY_TITLE = "New Thread";

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

export function mainSessionDisplayTitle(title: string | null | undefined): string {
  return isUntitledMainSessionTitle(title) ? NEW_THREAD_DISPLAY_TITLE : (title?.trim() ?? NEW_THREAD_DISPLAY_TITLE);
}
