/**
 * Local drafts use `vpd-<timestamp>`; Studio templates use `vpd-template-*` (or legacy `tpl-*`).
 * Persisted docs from Django use a real UUID / opaque id.
 */
export const isPersistedVpdId = (id: string | undefined | null): boolean => {
  if (!id?.trim()) return false;
  if (id.startsWith("vpd-template-")) return false;
  if (id.startsWith("vpd-")) return false;
  if (id.startsWith("tpl-")) return false;
  return true;
};
