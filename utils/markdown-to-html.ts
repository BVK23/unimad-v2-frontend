/** Same detection as pdf-export / CoverLetterInlineEditor */
export const isHtmlLikeContent = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

type ListMode = "ul" | "ol" | false;

const BULLET_LINE = /^(?:[-*+]\s+|•\s*|\u2022\s*)/u;
const ORDERED_LINE = /^(\d+)\.\s+(.+)$/;

/** Lines like **Strategic Vision:** rest of sentence — common in generated cover letters */
const BOLD_LABEL_LINE = /^\s*\*\*[^*]+\*\*\s*[:\-–—]/;

const closeList = (mode: ListMode, htmlLines: string[]) => {
  if (mode === "ul") htmlLines.push("</ul>");
  if (mode === "ol") htmlLines.push("</ol>");
};

export const inlineMarkdownToHtml = (text: string) => {
  if (!text) return "";
  let result = text;
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");
  return result;
};

/**
 * Converts application-asset markdown (cover letter, cold email, referral) to HTML.
 * Handles bold-label runs as bullet lists and explicit `-` / `*` list lines.
 */
export const markdownToHtml = (input: string): string => {
  if (!input) return "";

  if (isHtmlLikeContent(input)) return input;

  const lines = input.split("\n");
  const htmlLines: string[] = [];
  let listMode: ListMode = false;

  const flushBoldLabelRun = (run: string[]) => {
    if (run.length < 2) {
      run.forEach(line => {
        htmlLines.push(`<p>${inlineMarkdownToHtml(line.trim())}</p>`);
      });
      run.length = 0;
      return;
    }
    htmlLines.push("<ul>");
    run.forEach(line => {
      htmlLines.push(`<li>${inlineMarkdownToHtml(line.trim())}</li>`);
    });
    htmlLines.push("</ul>");
    run.length = 0;
  };

  const boldLabelRun: string[] = [];

  const processLine = (rawLine: string) => {
    const line = rawLine.trimEnd();
    if (!line) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode) {
        closeList(listMode, htmlLines);
        listMode = false;
      }
      return;
    }

    const ordered = line.match(ORDERED_LINE);
    if (ordered) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode !== "ol") {
        closeList(listMode, htmlLines);
        htmlLines.push("<ol>");
        listMode = "ol";
      }
      htmlLines.push(`<li>${inlineMarkdownToHtml(ordered[2])}</li>`);
      return;
    }

    if (BULLET_LINE.test(line)) {
      flushBoldLabelRun(boldLabelRun);
      if (listMode !== "ul") {
        closeList(listMode, htmlLines);
        htmlLines.push("<ul>");
        listMode = "ul";
      }
      const itemText = line.replace(BULLET_LINE, "");
      htmlLines.push(`<li>${inlineMarkdownToHtml(itemText)}</li>`);
      return;
    }

    if (listMode) {
      closeList(listMode, htmlLines);
      listMode = false;
    }

    if (BOLD_LABEL_LINE.test(line)) {
      boldLabelRun.push(line);
      return;
    }

    flushBoldLabelRun(boldLabelRun);

    let paragraph = line;
    if (paragraph.startsWith("### ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(4))}</strong>`;
    } else if (paragraph.startsWith("## ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(3))}</strong>`;
    } else if (paragraph.startsWith("# ")) {
      paragraph = `<strong>${inlineMarkdownToHtml(paragraph.slice(2))}</strong>`;
    } else {
      paragraph = inlineMarkdownToHtml(paragraph);
    }

    htmlLines.push(`<p>${paragraph}</p>`);
  };

  lines.forEach(processLine);
  flushBoldLabelRun(boldLabelRun);
  if (listMode) closeList(listMode, htmlLines);

  return htmlLines.join("");
};
