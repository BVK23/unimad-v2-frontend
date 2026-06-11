import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";
import { Document, LineRuleType, Packer, Paragraph, TextRun } from "docx";

/** Match preview / PDF: Helvetica-like sans-serif at 11pt */
const DOC_FONT = "Arial";
const DOC_FONT_SIZE = 22; // half-points → 11pt
const PARAGRAPH_AFTER = 240; // 12pt gap between paragraphs
const LIST_ITEM_AFTER = 160;
/** 11pt × 1.6 line height (240 = single spacing in Word) */
const LINE_SPACING = 384;
/** ~53px page padding from preview ≈ 0.55" */
const PAGE_MARGIN = 800;

type RunOptions = {
  bold?: boolean;
  italics?: boolean;
  underline?: { type: "single" };
};

const paragraphSpacing = {
  after: PARAGRAPH_AFTER,
  line: LINE_SPACING,
  lineRule: LineRuleType.AUTO,
};

const listItemSpacing = {
  after: LIST_ITEM_AFTER,
  line: LINE_SPACING,
  lineRule: LineRuleType.AUTO,
};

function makeRun(text: string, inherited: RunOptions = {}): TextRun {
  return new TextRun({
    text,
    font: DOC_FONT,
    size: DOC_FONT_SIZE,
    ...inherited,
  });
}

function textRunsFromNode(node: ChildNode, keyPrefix: string, inherited: RunOptions = {}): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ");
    if (!text.trim()) return [];
    return [makeRun(text, inherited)];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const next: RunOptions = { ...inherited };

  if (tag === "strong" || tag === "b") next.bold = true;
  if (tag === "em" || tag === "i") next.italics = true;
  if (tag === "u") next.underline = { type: "single" };

  if (tag === "br") {
    return [new TextRun({ text: "", font: DOC_FONT, size: DOC_FONT_SIZE, break: 1 })];
  }

  if (tag === "p") {
    return Array.from(element.childNodes).flatMap((child, idx) => textRunsFromNode(child, `${keyPrefix}-p-${idx}`, inherited));
  }

  return Array.from(element.childNodes).flatMap((child, idx) => textRunsFromNode(child, `${keyPrefix}-${idx}`, next));
}

function paragraphFromElement(element: HTMLElement, key: string): Paragraph | null {
  const tag = element.tagName.toLowerCase();

  if (tag === "ul" || tag === "ol") {
    return null;
  }

  if (tag === "p" || tag === "div" || tag === "h1" || tag === "h2" || tag === "h3") {
    const runs = textRunsFromNode(element, key, tag.startsWith("h") ? { bold: true } : {});
    if (runs.length === 0) return null;
    return new Paragraph({ children: runs, spacing: paragraphSpacing });
  }

  const runs = textRunsFromNode(element, key);
  if (runs.length === 0) return null;
  return new Paragraph({ children: runs, spacing: paragraphSpacing });
}

/**
 * Manual bullets (not Word ListParagraph) so font/spacing stay consistent in Pages & Word.
 */
function paragraphsFromList(listEl: HTMLElement, ordered: boolean, key: string): Paragraph[] {
  const items = Array.from(listEl.querySelectorAll(":scope > li"));
  return items.flatMap((li, index) => {
    const runs = textRunsFromNode(li, `${key}-li-${index}`);
    if (runs.length === 0) return [];
    const prefix = ordered ? `${index + 1}. ` : "\u2022 ";
    return [
      new Paragraph({
        children: [makeRun(prefix), ...runs],
        indent: { left: 720, hanging: 360 },
        spacing: listItemSpacing,
      }),
    ];
  });
}

function htmlToDocxParagraphs(html: string): Paragraph[] {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    const plain = html.replace(/<[^>]+>/g, "\n").trim();
    return plain
      .split(/\n+/)
      .filter(Boolean)
      .map(line => new Paragraph({ children: [makeRun(line)], spacing: paragraphSpacing }));
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const paragraphs: Paragraph[] = [];

  Array.from(doc.body.childNodes).forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text) {
        paragraphs.push(new Paragraph({ children: [makeRun(text)], spacing: paragraphSpacing }));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "ul") {
      paragraphs.push(...paragraphsFromList(element, false, `ul-${index}`));
      return;
    }

    if (tag === "ol") {
      paragraphs.push(...paragraphsFromList(element, true, `ol-${index}`));
      return;
    }

    const paragraph = paragraphFromElement(element, `block-${index}`);
    if (paragraph) paragraphs.push(paragraph);
  });

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [makeRun("")] })];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function exportContentAsDocx(content: string, filename: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  const html = normalizeContentToHtml(trimmed);
  const children = htmlToDocxParagraphs(html);

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: DOC_FONT,
            size: DOC_FONT_SIZE,
          },
          paragraph: {
            spacing: paragraphSpacing,
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: DOC_FONT,
            size: DOC_FONT_SIZE,
          },
          paragraph: {
            spacing: paragraphSpacing,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, filename.endsWith(".docx") ? filename : `${filename.replace(/\.[^.]+$/, "")}.docx`);
}
