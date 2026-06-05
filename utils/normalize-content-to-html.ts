import { htmlToPlainText } from "@/utils/html-to-text";
import { isHtmlLikeContent, markdownToHtml } from "@/utils/markdown-to-html";

/** Same detection as pdf-export.tsx `isHtmlLikeString` */
export const isHtmlContent = (s: string) => isHtmlLikeContent(s);

/** HTML from contentEditable that still contains raw markdown markers */
const looksLikeMarkdownInHtml = (content: string) => {
  if (!isHtmlLikeContent(content)) return false;
  if (/<strong>|<b[\s>]/i.test(content)) return false;
  return /\*\*/.test(content) || /^\s*[-*+]\s/m.test(content);
};

const isBoldLabelParagraph = (chunk: string) => /^\s*<p>\s*<strong>[^<]+:<\/strong>/i.test(chunk.trim());

/** Turn consecutive <p><strong>Label:</strong> …</p> blocks into a bullet list */
export const coalesceBoldLabelParagraphsInHtml = (html: string): string => {
  const chunks = html.split(/(?=<p[\s>])/i).filter(Boolean);
  if (chunks.length < 2) return html;

  const out: string[] = [];
  let run: string[] = [];

  const flushRun = () => {
    if (run.length >= 2) {
      out.push("<ul>");
      run.forEach(p => {
        const inner = p.replace(/^\s*<p[^>]*>/i, "").replace(/<\/p>\s*$/i, "");
        out.push(`<li>${inner}</li>`);
      });
      out.push("</ul>");
    } else {
      out.push(...run);
    }
    run = [];
  };

  chunks.forEach(chunk => {
    if (isBoldLabelParagraph(chunk)) {
      run.push(chunk);
      return;
    }
    flushRun();
    out.push(chunk);
  });
  flushRun();

  return out.join("");
};

export const normalizeContentToHtml = (content: string): string => {
  if (!content?.trim()) return "";
  if (looksLikeMarkdownInHtml(content)) {
    return markdownToHtml(htmlToPlainText(content));
  }
  if (isHtmlContent(content)) {
    return coalesceBoldLabelParagraphsInHtml(content);
  }
  return markdownToHtml(content);
};
