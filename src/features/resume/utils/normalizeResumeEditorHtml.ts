/**
 * Normalize resume rich-text HTML for TipTap so bold/italic marks and toolbar state stay in sync.
 * AI output often uses inline font-weight instead of <strong>.
 */
export const normalizeResumeEditorHtml = (html: string): string => {
  if (!html?.trim()) return "";

  let out = html;

  // Inline font-weight → semantic bold (TipTap Bold extension).
  out = out.replace(
    /<span([^>]*?)style="([^"]*?)font-weight:\s*(bold|bolder|[67]00)([^"]*?)"([^>]*?)>([\s\S]*?)<\/span>/gi,
    (_match, _before, _styleStart, _weight, _styleEnd, _after, inner) => `<strong>${inner}</strong>`
  );

  // Remaining style-only spans without font-weight can stay; unwrap empty spans.
  out = out.replace(/<span[^>]*>\s*<\/span>/gi, "");

  return out;
};
