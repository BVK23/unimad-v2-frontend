import React from "react";
import { Text, View, Link } from "@react-pdf/renderer";

interface HtmlRendererProps {
  html: string;
  style?: any;
  /** Optional smaller size for list item text (e.g. Nextgen uses 9pt bullets vs 10pt body) */
  listFontSize?: number;
}

/**
 * Parses Tiptap HTML output and renders it using @react-pdf/renderer components.
 * Shared across ALL template PDF components.
 *
 * Supported tags: <strong>, <b>, <em>, <i>, <u>, <a href>, <p>, <ul>, <ol>, <li>
 * Supports nested formatting via a style stack.
 */
const HtmlRenderer: React.FC<HtmlRendererProps> = ({ html, style, listFontSize }) => {
  if (!html) return null;

  // Remove wrapper <div> if any
  let cleanHtml = html.replace(/^<div.*?>|<\/div>$/g, "");

  // Common cleanup: Remove <p> tags if they are inside <li> (Tiptap sometimes does <li><p>...</p></li>)
  cleanHtml = cleanHtml.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, "<li>$1</li>");

  const parseInline = (text: string) => {
    // Tokenize by splitting on tags — includes <u> for underline support
    const tokens = text.split(/(<\/?(?:strong|b|em|i|u|a|span)[^>]*?>)/gi);

    const nodes: React.ReactNode[] = [];
    const styleStack: Array<{
      fontWeight?: any;
      fontStyle?: any;
      color?: string;
      textDecoration?: "none" | "underline" | "line-through" | undefined;
    }> = [];
    let currentLink: string | null = null;

    tokens.forEach((token, index) => {
      if (!token) return;

      if (/^<(strong|b)(\s|>)/i.test(token)) {
        styleStack.push({ fontWeight: 700 });
      } else if (/^<\/(strong|b)>/i.test(token)) {
        const idx = styleStack.map(s => s.fontWeight).lastIndexOf(700);
        if (idx !== -1) styleStack.splice(idx, 1);
      } else if (/^<(em|i)(\s|>)/i.test(token)) {
        styleStack.push({ fontStyle: "italic" });
      } else if (/^<\/(em|i)>/i.test(token)) {
        const idx = styleStack.map(s => s.fontStyle).lastIndexOf("italic");
        if (idx !== -1) styleStack.splice(idx, 1);
      } else if (/^<u(\s|>)/i.test(token)) {
        styleStack.push({ textDecoration: "underline" });
      } else if (/^<\/u>/i.test(token)) {
        const idx = styleStack.findIndex(s => s.textDecoration === "underline");
        if (idx !== -1) styleStack.splice(idx, 1);
      } else if (/^<a\s/i.test(token)) {
        const hrefMatch = token.match(/href=["'](.*?)["']/);
        if (hrefMatch) currentLink = hrefMatch[1];
        styleStack.push({ color: "#346de0", textDecoration: "none" });
      } else if (/^<\/a>/i.test(token)) {
        currentLink = null;
        const idx = styleStack.findIndex(s => s.color === "#346de0");
        if (idx !== -1) styleStack.splice(idx, 1);
      } else if (/^<\/?span[^>]*>/i.test(token)) {
        // <span> is a generic inline container — just consume/skip the tag
      } else {
        // Text node: decode entities
        const decoded = token
          .replace(/&amp;/g, "&")
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"');

        // Merge styles
        const combinedStyle = styleStack.reduce((acc, curr) => ({ ...acc, ...curr }), {});

        if (currentLink) {
          nodes.push(
            <Link key={index} src={currentLink} style={combinedStyle}>
              {decoded}
            </Link>
          );
        } else {
          nodes.push(
            <Text key={index} style={combinedStyle}>
              {decoded}
            </Text>
          );
        }
      }
    });

    return nodes;
  };

  // Process blocks sequentially to preserve order and handle formatting
  const blocks: React.ReactNode[] = [];
  const blockRegex = /<(p|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  // If no tags are found at all, treat as plain text (fallback)
  if (!cleanHtml.match(/<(p|ul|ol)/i)) {
    return <Text style={{ lineHeight: 1.4, ...style }}>{parseInline(cleanHtml)}</Text>;
  }

  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const key = blocks.length;

    if (tag === "p") {
      blocks.push(
        <Text key={key} style={{ marginBottom: 4, height: "auto", lineHeight: 1.4, ...style }}>
          {parseInline(content)}
        </Text>
      );
    } else if (tag === "ul" || tag === "ol") {
      const items = content.match(/<li.*?>(.*?)<\/li>/g);
      if (items) {
        const liSize = listFontSize ?? style?.fontSize ?? 10;
        const bulletStyle = { fontWeight: 600 as const, marginRight: 4 };
        blocks.push(
          <View key={key} style={style}>
            {items.map((item, i) => (
              <View key={`${key}-${i}`} style={{ flexDirection: "row", marginBottom: 2, alignItems: "flex-start" }}>
                <Text style={{ ...bulletStyle, fontSize: liSize, lineHeight: 1.4, flexShrink: 0, ...style }}>•</Text>
                <Text style={{ flex: 1, fontSize: liSize, lineHeight: 1.4, color: style?.color || "#334155", ...style }}>
                  {parseInline(item.replace(/<\/?li.*?>/g, ""))}
                </Text>
              </View>
            ))}
          </View>
        );
      }
    }
  }

  return <>{blocks}</>;
};

export default HtmlRenderer;
