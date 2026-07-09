import React from "react";

export type HtmlDisplayVariant = "default" | "pdfTight";

/**
 * Hanging-indent list layout using text-indent + padding-left.
 * The ::before bullet is inline content on the same text line as the words,
 * so it shares the exact same baseline — no vertical drift on multi-line items.
 */
const RESUME_LIST_LAYOUT_CLASSES = [
  // Strip native list styles (Tailwind preflight already does, but be explicit)
  "[&_ul]:list-none [&_ul]:m-0 [&_ul]:p-0",
  "[&_ol]:list-none [&_ol]:m-0 [&_ol]:p-0 [&_ol]:[counter-reset:li]",
  // Hanging indent: padding makes wrapped lines indent, text-indent pulls first line back
  "[&_ul>li]:pl-[0.9em] [&_ul>li]:[text-indent:-0.9em]",
  "[&_ol>li]:pl-[1.2em] [&_ol>li]:[text-indent:-1.2em]",
  // UL bullet — inline ::before on the same baseline as text
  "[&_ul>li]:before:content-['•\\00a0'] [&_ul>li]:before:font-semibold",
  // OL counter — inline ::before
  "[&_ol>li]:[counter-increment:li] [&_ol>li]:before:[content:counter(li)'.\\00a0'] [&_ol>li]:before:font-semibold",
  // Shared list-item spacing + prevent page-break splitting bullet from text
  "[&_li]:mb-[2px] [&_li]:[break-inside:avoid]",
  // Hide empty list items (no stray lone bullets)
  "[&_li:empty]:hidden [&_li:empty]:before:content-none",
  // Tiptap wraps li content in <p>; make it inline so text-indent works across it
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
}

/**
 * Renders Tiptap HTML output into the inline preview.
 * Uses `dangerouslySetInnerHTML` — in production, sanitize with DOMPurify.
 * Shared across ALL template preview components.
 */
const HtmlDisplay: React.FC<HtmlDisplayProps> = ({ content, className = "", variant = "default" }) => {
  if (!content) return null;

  const pdfTightBase =
    "max-w-none text-inherit leading-[1.4] [&_p]:mb-[4px] [&_p:last-child]:mb-0 " +
    RESUME_LIST_LAYOUT_CLASSES +
    " [&_ul]:my-0 [&_ol]:my-0 [&_li]:leading-[1.4] " +
    "[&_a]:text-[#346de0] [&_strong]:font-bold [&_em]:italic [&_u]:underline";

  const mergedClassName =
    variant === "pdfTight"
      ? `${pdfTightBase} ${className}`.trim()
      : `max-w-none leading-[1.4] ${RESUME_LIST_LAYOUT_CLASSES} ${className} [&>p]:mb-1 [&>ul]:my-1 [&>ul]:mb-2 [&>ol]:my-1 [&>ol]:mb-2`.trim();

  return <div className={mergedClassName} dangerouslySetInnerHTML={{ __html: normalizeResumeHtml(content) }} />;
};

export default HtmlDisplay;
