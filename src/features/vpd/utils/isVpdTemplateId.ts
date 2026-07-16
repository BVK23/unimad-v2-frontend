/**
 * Studio V2 template fixture ids from `/api/vpd/landing/` (`vpdTemplatesV2`).
 * These are not user-owned rows — edits must be claimed via duplicate.
 */
export const isVpdTemplateId = (id: string | undefined | null): boolean => {
  if (!id?.trim()) return false;
  return id.startsWith("vpd-template-") || id.startsWith("tpl-");
};
