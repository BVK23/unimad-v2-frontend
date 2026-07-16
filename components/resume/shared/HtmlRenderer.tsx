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

  // Unwrap <p> from <li> so bullet + text share one line (Tiptap often does <li><p>…</p></li>)
  cleanHtml = cleanHtml.replace(/<li>([\s\S]*?)<\/li>/gi, (_match, inner: string) => {
    const stripped = inner
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, " ")
      .trim();
    if (!stripped) return "";
    return `<li>${stripped}</li>`;
  });

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

  // If no tags are found at all, treat as plain text (fallback)
  if (!cleanHtml.match(/<(p|ul|ol)/i)) {
    return <Text style={{ lineHeight: 1.4, ...style }}>{parseInline(cleanHtml)}</Text>;
  }

  // Collect blocks up front so the final block can drop its trailing margin —
  // otherwise every description ends with dead space that (in @react-pdf,
  // where margins don't collapse) stacks onto the entry gap and inflates height.
  const matches = Array.from(cleanHtml.matchAll(blockRegex));
  const lastBlockIndex = matches.length - 1;

  matches.forEach((match, blockIndex) => {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const key = blocks.length;
    const isLastBlock = blockIndex === lastBlockIndex;

    if (tag === "p") {
      blocks.push(
        <Text key={key} style={{ marginBottom: isLastBlock ? 0 : 4, height: "auto", lineHeight: 1.4, ...style }}>
          {parseInline(content)}
        </Text>
      );
    } else if (tag === "ul" || tag === "ol") {
      const items = content.match(/<li.*?>(.*?)<\/li>/g);
      if (items) {
        const liSize = listFontSize ?? style?.fontSize ?? 10;
        // Marker + text must share one line-height, else the (taller) marker
        // inflates each single-line bullet row and it looks more spacious than
        // the wrapped lines inside a multi-line bullet.
        const liLineHeight = (style?.lineHeight as number) ?? 1.4;
        const itemTextStyle = {
          marginBottom: 2,
          fontSize: liSize,
          color: style?.color || "#334155",
          ...style,
          lineHeight: liLineHeight,
        };
        const markerStyle = { fontWeight: 600 as const };
        let lastValidItemIndex = -1;
        items.forEach((it, idx) => {
          if (it.replace(/<\/?li[^>]*>/gi, "").trim()) lastValidItemIndex = idx;
        });
        let olCounter = 0;
        blocks.push(
          <View key={key} style={style}>
            {items.map((item, i) => {
              const text = item.replace(/<\/?li[^>]*>/gi, "").trim();
              if (!text) return null;
              olCounter++;
              const marker = tag === "ol" ? `${olCounter}.` : "•";
              const markerWidth = tag === "ol" ? 14 : 8;
              const isLastItem = i === lastValidItemIndex;
              return (
                <View
                  key={`${key}-${i}`}
                  wrap={false}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: isLastBlock && isLastItem ? 0 : 2,
                  }}
                >
                  <Text
                    style={{
                      ...markerStyle,
                      fontSize: liSize,
                      lineHeight: liLineHeight,
                      width: markerWidth,
                      color: style?.color || "#334155",
                    }}
                  >
                    {marker}
                  </Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ ...itemTextStyle, marginBottom: 0 }}>{parseInline(text)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }
    }
  });

  return <>{blocks}</>;
};

export default HtmlRenderer;
