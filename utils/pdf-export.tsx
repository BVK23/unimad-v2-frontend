import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// Basic shape of Tiptap JSON we care about
type TiptapMark = { type: string };
type TiptapTextNode = { type?: string; text?: string; marks?: TiptapMark[] };
type TiptapNode = {
  type: string;
  attrs?: { level?: number };
  content?: TiptapTextNode[] | TiptapNode[];
};

type TiptapJson = {
  type?: string;
  content?: TiptapNode[];
};

type InlinePiece =
  | string
  | {
      type: "bold" | "italic" | "strikethrough";
      content: string;
    };
const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.6,
    color: "#333",
  },
  heading1: {
    fontSize: 24,
    fontWeight: 700,
    color: "#346DE0",
    marginTop: 12,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 700,
    color: "#346DE0",
    marginTop: 12,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 14,
    fontWeight: 700,
    color: "#346DE0",
    marginTop: 10,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
  },
  list: {
    marginLeft: 20,
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#346DE0",
    paddingLeft: 12,
    marginLeft: 0,
    marginBottom: 8,
    color: "#666",
  },
});

type MarkState = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

const processTiptapMarks = (content: TiptapTextNode, marks: MarkState = {}): { text: string; marks: MarkState } => {
  if (!content) return { text: "", marks };

  const styles: MarkState = { ...marks };

  if (!content.marks || content.marks.length === 0) {
    return { text: content.text ?? "", marks: styles };
  }

  content.marks.forEach(mark => {
    if (mark.type === "bold") styles.bold = true;
    if (mark.type === "italic") styles.italic = true;
    if (mark.type === "underline") styles.underline = true;
    if (mark.type === "strike") styles.strike = true;
  });

  return { text: content.text ?? "", marks: styles };
};

const parseTiptapJsonToPDF = (jsonContent: TiptapJson | null | undefined): React.ReactNode[] => {
  if (!jsonContent || !jsonContent.content) return [];

  const components: React.ReactNode[] = [];

  const createStyledText = (text: string, marks: MarkState, key: string) => {
    if (!text) return null;

    if (marks.bold || marks.italic || marks.underline) {
      return (
        <Text
          key={key}
          style={{
            fontWeight: marks.bold ? 700 : marks.italic ? 500 : 400,
            textDecoration: marks.underline ? "underline" : "none",
          }}
        >
          {text}
        </Text>
      );
    }

    return <Text key={key}>{text}</Text>;
  };

  const processNode = (node: TiptapNode, index: number): React.ReactNode | null => {
    if (!node) return null;

    const { type, content: nodeContent, attrs = {} } = node;

    if (type === "paragraph") {
      const textElements: React.ReactNode[] = [];
      const children = (nodeContent as TiptapTextNode[]) || [];

      if (children.length > 0) {
        children.forEach((child, idx) => {
          const { text, marks } = processTiptapMarks(child);
          textElements.push(createStyledText(text, marks, `p-${index}-${idx}`));
        });
      } else {
        return (
          <Text key={index} style={pdfStyles.paragraph}>
            {" "}
          </Text>
        );
      }

      return (
        <Text key={index} style={pdfStyles.paragraph}>
          {textElements}
        </Text>
      );
    }

    if (type === "heading") {
      const level = attrs.level ?? 1;
      const styleKey = `heading${level}` as keyof typeof pdfStyles;
      const textElements: React.ReactNode[] = [];
      const children = (nodeContent as TiptapTextNode[]) || [];

      children.forEach((child, idx) => {
        const { text, marks } = processTiptapMarks(child);
        textElements.push(createStyledText(text, marks, `h-${index}-${idx}`));
      });

      return (
        <Text key={index} style={pdfStyles[styleKey] ?? pdfStyles.paragraph}>
          {textElements}
        </Text>
      );
    }

    if (type === "bulletList") {
      const items: React.ReactNode[] = [];
      const children = (nodeContent as TiptapNode[]) || [];

      children.forEach((child, idx) => {
        if (child.type === "listItem" && child.content) {
          const itemContent = (child.content[0] as TiptapNode) || null;
          const textElements: React.ReactNode[] = [];
          const inner = (itemContent?.content as TiptapTextNode[]) || [];

          inner.forEach((textNode, textIdx) => {
            const { text, marks } = processTiptapMarks(textNode);
            textElements.push(createStyledText(text, marks, `bl-${index}-${idx}-${textIdx}`));
          });

          items.push(
            <Text key={idx} style={pdfStyles.listItem}>
              • {textElements}
            </Text>
          );
        }
      });

      return (
        <View key={index} style={pdfStyles.list}>
          {items}
        </View>
      );
    }

    if (type === "orderedList") {
      const items: React.ReactNode[] = [];
      const children = (nodeContent as TiptapNode[]) || [];

      children.forEach((child, idx) => {
        if (child.type === "listItem" && child.content) {
          const itemContent = (child.content[0] as TiptapNode) || null;
          const textElements: React.ReactNode[] = [];
          const inner = (itemContent?.content as TiptapTextNode[]) || [];

          inner.forEach((textNode, textIdx) => {
            const { text, marks } = processTiptapMarks(textNode);
            textElements.push(createStyledText(text, marks, `ol-${index}-${idx}-${textIdx}`));
          });

          items.push(
            <Text key={idx} style={pdfStyles.listItem}>
              {idx + 1}. {textElements}
            </Text>
          );
        }
      });

      return (
        <View key={index} style={pdfStyles.list}>
          {items}
        </View>
      );
    }

    if (type === "blockquote") {
      const paragraphs: React.ReactNode[] = [];
      const children = (nodeContent as TiptapNode[]) || [];

      children.forEach((para, pIdx) => {
        if (para.type === "paragraph" && para.content) {
          const textElements: React.ReactNode[] = [];
          const inner = (para.content as TiptapTextNode[]) || [];

          inner.forEach((textNode, tIdx) => {
            const { text, marks } = processTiptapMarks(textNode);
            textElements.push(createStyledText(text, marks, `bq-${index}-${pIdx}-${tIdx}`));
          });

          paragraphs.push(
            <Text key={pIdx} style={{ marginBottom: 4 }}>
              {textElements}
            </Text>
          );
        }
      });

      return (
        <View key={index} style={pdfStyles.blockquote}>
          {paragraphs}
        </View>
      );
    }

    return null;
  };

  jsonContent.content.forEach((node, index) => {
    const component = processNode(node, index);
    if (component) components.push(component);
  });

  return components;
};

const parseInlineFormatting = (text: string): InlinePiece[] => {
  const result: InlinePiece[] = [];
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(~~)(.*?)\5/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      result.push({ type: "bold", content: match[2] });
    } else if (match[3]) {
      result.push({ type: "italic", content: match[4] });
    } else if (match[5]) {
      result.push({ type: "strikethrough", content: match[6] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  if (result.length === 0) return [text];

  return result;
};

const createPDFText = (content: string): React.ReactNode[] => {
  const elements = parseInlineFormatting(content);

  return elements.map((el, idx) => {
    if (typeof el === "string") return el;

    if (el.type === "bold") {
      return (
        <Text key={idx} style={{ fontWeight: 700 }}>
          {el.content}
        </Text>
      );
    }

    if (el.type === "italic") {
      return (
        <Text key={idx} style={{ fontWeight: 500 }}>
          {el.content}
        </Text>
      );
    }

    if (el.type === "strikethrough") {
      return (
        <Text key={idx} style={{ textDecoration: "line-through" }}>
          {el.content}
        </Text>
      );
    }

    return el.content;
  });
};

type MarkdownLike =
  | string
  | {
      markdown?: string;
    };

const parseMarkdownToPDF = (content: MarkdownLike): React.ReactNode[] => {
  const contentStr = typeof content === "string" ? content : (content?.markdown ?? "");
  if (!contentStr) return [];

  const lines = contentStr.split("\n");
  const components: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("# ")) {
      components.push(
        <Text key={index} style={pdfStyles.heading1}>
          {createPDFText(trimmedLine.slice(2))}
        </Text>
      );
      return;
    }

    if (trimmedLine.startsWith("## ")) {
      components.push(
        <Text key={index} style={pdfStyles.heading2}>
          {createPDFText(trimmedLine.slice(3))}
        </Text>
      );
      return;
    }

    if (trimmedLine.startsWith("### ")) {
      components.push(
        <Text key={index} style={pdfStyles.heading3}>
          {createPDFText(trimmedLine.slice(4))}
        </Text>
      );
      return;
    }

    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      const itemContent = trimmedLine.slice(2);
      listItems.push(
        <Text key={index} style={pdfStyles.listItem}>
          • {createPDFText(itemContent)}
        </Text>
      );
      return;
    }

    if (trimmedLine.startsWith("1. ") || /^\d+\. /.test(trimmedLine)) {
      const match = trimmedLine.match(/^\d+\.\s+(.+)$/);
      if (match) {
        const itemContent = match[1];
        const numberMatch = trimmedLine.match(/^\d+/);
        const number = numberMatch ? numberMatch[0] : "";
        listItems.push(
          <Text key={index} style={pdfStyles.listItem}>
            {number}. {createPDFText(itemContent)}
          </Text>
        );
      }
      return;
    }

    if (trimmedLine.startsWith("> ")) {
      const itemContent = trimmedLine.slice(2);
      components.push(
        <Text key={index} style={pdfStyles.blockquote}>
          {createPDFText(itemContent)}
        </Text>
      );
      return;
    }

    if (trimmedLine.length > 0) {
      if (listItems.length > 0) {
        components.push(
          <View key={`list-${index}`} style={pdfStyles.list}>
            {listItems}
          </View>
        );
        listItems = [];
      }

      components.push(
        <Text key={index} style={pdfStyles.paragraph}>
          {createPDFText(trimmedLine)}
        </Text>
      );
    }
  });

  if (listItems.length > 0) {
    components.push(
      <View key="final-list" style={pdfStyles.list}>
        {listItems}
      </View>
    );
  }

  return components;
};

const isHtmlLikeString = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const parseHtmlToPDF = (html: string): React.ReactNode[] => {
  if (!html) return [];

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return parseMarkdownToPDF(
      html
        .replace(/<\s*br\s*\/?>/gi, "\n")
        .replace(/<\/\s*p\s*>/gi, "\n")
        .replace(/<\/\s*li\s*>/gi, "\n")
        .replace(/<\/?[^>]+>/g, "")
    );
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const bodyNodes = Array.from(doc.body.childNodes);

  const renderInlineNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/\s+/g, " ");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map((child, idx) => renderInlineNode(child, `${key}-${idx}`));

    if (tag === "strong" || tag === "b") {
      return (
        <Text key={key} style={{ fontWeight: 700 }}>
          {children}
        </Text>
      );
    }

    if (tag === "em" || tag === "i") {
      return (
        <Text key={key} style={{ fontStyle: "italic" }}>
          {children}
        </Text>
      );
    }

    if (tag === "u") {
      return (
        <Text key={key} style={{ textDecoration: "underline" }}>
          {children}
        </Text>
      );
    }

    if (tag === "s" || tag === "strike") {
      return (
        <Text key={key} style={{ textDecoration: "line-through" }}>
          {children}
        </Text>
      );
    }

    if (tag === "br") return "\n";

    return <Text key={key}>{children}</Text>;
  };

  const renderInlineChildren = (node: ParentNode, key: string) =>
    Array.from(node.childNodes).map((child, idx) => renderInlineNode(child, `${key}-${idx}`));

  const components: React.ReactNode[] = [];

  bodyNodes.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (!text) return;
      components.push(
        <Text key={`text-${index}`} style={pdfStyles.paragraph}>
          {text}
        </Text>
      );
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "p" || tag === "div") {
      components.push(
        <Text key={`p-${index}`} style={pdfStyles.paragraph}>
          {renderInlineChildren(element, `p-${index}`)}
        </Text>
      );
      return;
    }

    if (tag === "ul") {
      const items = Array.from(element.querySelectorAll(":scope > li")).map((li, liIndex) => (
        <Text key={`ul-${index}-${liIndex}`} style={pdfStyles.listItem}>
          • {renderInlineChildren(li, `ul-${index}-${liIndex}`)}
        </Text>
      ));

      components.push(
        <View key={`ul-${index}`} style={pdfStyles.list}>
          {items}
        </View>
      );
      return;
    }

    if (tag === "ol") {
      const items = Array.from(element.querySelectorAll(":scope > li")).map((li, liIndex) => (
        <Text key={`ol-${index}-${liIndex}`} style={pdfStyles.listItem}>
          {liIndex + 1}. {renderInlineChildren(li, `ol-${index}-${liIndex}`)}
        </Text>
      ));

      components.push(
        <View key={`ol-${index}`} style={pdfStyles.list}>
          {items}
        </View>
      );
      return;
    }

    if (tag === "blockquote") {
      components.push(
        <View key={`bq-${index}`} style={pdfStyles.blockquote}>
          <Text>{renderInlineChildren(element, `bq-${index}`)}</Text>
        </View>
      );
      return;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const style = tag === "h1" ? pdfStyles.heading1 : tag === "h2" ? pdfStyles.heading2 : pdfStyles.heading3;
      components.push(
        <Text key={`h-${index}`} style={style}>
          {renderInlineChildren(element, `h-${index}`)}
        </Text>
      );
      return;
    }

    components.push(
      <Text key={`fallback-${index}`} style={pdfStyles.paragraph}>
        {renderInlineChildren(element, `fallback-${index}`)}
      </Text>
    );
  });

  return components;
};

export const exportContentAsPDF = (
  content: MarkdownLike,
  filename = "export.pdf",
  jsonContent: TiptapJson | null = null
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const contentStr = typeof content === "string" ? content : (content?.markdown ?? "");
      const pageContent = jsonContent
        ? parseTiptapJsonToPDF(jsonContent)
        : isHtmlLikeString(contentStr)
          ? parseHtmlToPDF(contentStr)
          : parseMarkdownToPDF(content);

      const pdfContent = (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <View>{pageContent}</View>
          </Page>
        </Document>
      );

      pdf(pdfContent)
        .toBlob()
        .then(blob => {
          try {
            const url = URL.createObjectURL(blob);
            const element = document.createElement("a");
            element.href = url;
            element.download = filename;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            setTimeout(() => {
              URL.revokeObjectURL(url);
              resolve();
            }, 100);
          } catch (error) {
            reject(error);
          }
        })
        .catch(error => {
          reject(error);
        });
    } catch (error) {
      reject(error as Error);
    }
  });
};
