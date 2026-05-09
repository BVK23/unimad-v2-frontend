import React from "react";

export type HtmlDisplayVariant = "default" | "pdfTight";

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
    "max-w-none text-inherit leading-[1.4] [&_p]:mb-[4px] [&_p:last-child]:mb-0 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-[1.2em] [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-[1.1em] [&_li]:mb-[2px] [&_li]:leading-[1.4] [&_li]:marker:font-semibold [&_li>p]:mb-0 [&_a]:text-[#346de0] [&_strong]:font-bold [&_em]:italic [&_u]:underline";

  const mergedClassName =
    variant === "pdfTight"
      ? `${pdfTightBase} ${className}`.trim()
      : `prose prose-sm max-w-none ${className} [&>p]:mb-1 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-2`.trim();

  return <div className={mergedClassName} dangerouslySetInnerHTML={{ __html: content }} />;
};

export default HtmlDisplay;
