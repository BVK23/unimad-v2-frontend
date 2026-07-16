import React from "react";

export type HtmlDisplayVariant = "default" | "pdfTight";

/**
 * Native list markers with outside positioning so bullets stay inside the list
 * padding box. Avoids ::before + negative text-indent, which overflow-hidden
 * ancestors (ScaledA4PreviewShell, dashboard thumbnails, Prepare modal) clip away.
 */
const RESUME_LIST_LAYOUT_CLASSES = [
  "[&_ul]:m-0 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-[1.1em]",
  "[&_ol]:m-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-[1.4em]",
  "[&_li]:mb-[2px] [&_li]:[break-inside:avoid]",
  "[&_li:empty]:hidden",
  "[&_li>p]:inline [&_li>p]:m-0",
].join(" ");

/**
 * Unwrap block <p> inside <li> so bullet + text share one line box.
 * Keeps inline formatting tags (<strong>, <em>, etc.) intact.
 */
const normalizeResumeHtml = (html: string): string => {
  let clean = html.replace(/^<div.*?>|<\/div>$/g, "");
  clean = clean.replace(/<li>([\s\S]*?)<\/li>/gi, (_match, inner: string) => {
    const stripped = inner
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, " ")
      .trim();
    if (!stripped) return "";
    return `<li>${stripped}</li>`;
  });
  return clean;
};

interface HtmlDisplayProps {
  content: string;
  className?: string;
  /** pdfTight: matches @react-pdf HtmlRenderer rhythm (line-height 1.4, tight lists) — no typography plugin. */
  variant?: HtmlDisplayVariant;
  /** Override the class-based leading (inline, so it beats `leading-*`) to match a template's PDF body line-height. */
  lineHeight?: number;
}

/**
 * Renders Tiptap HTML output into the inline preview.
 * Uses `dangerouslySetInnerHTML` — in production, sanitize with DOMPurify.
 * Shared across ALL template preview components.
 */
const HtmlDisplay: React.FC<HtmlDisplayProps> = ({ content, className = "", variant = "default", lineHeight }) => {
  if (!content) return null;

  const pdfTightBase =
    "max-w-none text-inherit leading-[1.4] [&_p]:mb-[4px] [&_p:last-child]:mb-0 " +
    RESUME_LIST_LAYOUT_CLASSES +
    " [&_ul]:my-0 [&_ol]:my-0 [&_li]:leading-[1.4] " +
    "[&_a]:text-[#346de0] [&_strong]:font-bold [&_em]:italic [&_u]:underline";

  const mergedClassName =
    variant === "pdfTight"
      ? `${pdfTightBase} ${className}`.trim()
      : `max-w-none leading-[1.4] ${RESUME_LIST_LAYOUT_CLASSES} ${className} [&>p]:mb-1 [&>ul]:my-1 [&>ul]:mb-2 [&>ol]:my-1 [&>ol]:mb-2 [&>p:first-child]:mt-0 [&>ul:first-child]:mt-0 [&>ol:first-child]:mt-0 [&>p:last-child]:mb-0 [&>ul:last-child]:mb-0 [&>ol:last-child]:mb-0 [&_li:last-child]:mb-0`.trim();

  return (
    <div
      className={mergedClassName}
      style={lineHeight != null ? { lineHeight } : undefined}
      dangerouslySetInnerHTML={{ __html: normalizeResumeHtml(content) }}
    />
  );
};

export default HtmlDisplay;
