import type { PortfolioItem } from "@/types";

/**
 * Prepare portfolio HTML from migration or RichTextEditor for rendering.
 * BlockNote → v2 conversion entity-encodes inline markup inside segments, so tags like
 * &lt;br&gt; and &lt;em&gt; can appear literally unless decoded before innerHTML.
 */
const ENTITY_ENCODED_TAG_NAMES = ["br", "em", "strong", "b", "i", "u", "p", "ul", "ol", "li"] as const;

export type PortfolioTitleHeadingLevel = "h1" | "h2" | "h3";

const HEADING_TAG_PATTERN = /^<h([1-6])(\s[^>]*)?>([\s\S]*)<\/h\1>$/i;

export const normalizePortfolioHtmlForRender = (html: string): string => {
  let result = (html || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  if (!result) return "";

  for (const tag of ENTITY_ENCODED_TAG_NAMES) {
    if (tag === "br") {
      result = result.replace(/&lt;br\s*\/?&gt;/gi, "<br>");
      continue;
    }

    result = result.replace(new RegExp(`&lt;${tag}(\\s[^&]*?)?&gt;`, "gi"), (_, attrs = "") => `<${tag}${attrs}>`);
    result = result.replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`);
  }

  return result;
};

/** Heading level stored in title HTML from the rich-text editor, if any. */
export const extractTitleHeadingLevel = (html: string): PortfolioTitleHeadingLevel | null => {
  const normalized = normalizePortfolioHtmlForRender(html).trim();
  const match = normalized.match(HEADING_TAG_PATTERN);
  if (!match) return null;
  const level = match[1];
  if (level === "1") return "h1";
  if (level === "2") return "h2";
  if (level === "3") return "h3";
  return null;
};

/** Strip a single outer heading wrapper. */
export const unwrapHeadingTagsFromTitleHtml = (html: string): string => {
  const normalized = normalizePortfolioHtmlForRender(html).trim();
  if (!normalized) return "";

  const match = normalized.match(HEADING_TAG_PATTERN);
  if (match) {
    return match[3].trim();
  }

  return normalized;
};

/**
 * True when this block should default to semantic H1 (create-initial pipeline only).
 * Requires `templateSectionTitle` set at generation from BlockNote `templateSection` prop.
 */
export const shouldDefaultTemplateSectionTitleToH1 = (
  item: Pick<PortfolioItem, "type" | "title" | "templateSectionTitle">,
  options: { isNestedDetailView?: boolean } = {}
): boolean => {
  if (item.type !== "text" || !item.title?.trim()) return false;
  if (options.isNestedDetailView) return false;
  if (item.templateSectionTitle !== true) return false;
  if (extractTitleHeadingLevel(item.title)) return false;
  return true;
};

/**
 * True when this block should default to semantic H2 (experience/project entry from create-initial).
 * Requires `portfolioEntryTitle` set at conversion from BlockNote `entryTitle`.
 */
export const shouldDefaultPortfolioEntryTitleToH2 = (
  item: Pick<PortfolioItem, "type" | "title" | "portfolioEntryTitle">,
  options: { isNestedDetailView?: boolean } = {}
): boolean => {
  if (item.type !== "text" || !item.title?.trim()) return false;
  if (options.isNestedDetailView) return false;
  if (item.portfolioEntryTitle !== true) return false;
  if (extractTitleHeadingLevel(item.title)) return false;
  return true;
};

export type PortfolioTextTitlePresentation = {
  tag: PortfolioTitleHeadingLevel | "h3";
  html: string;
  useLargeTypography: boolean;
};

/** Resolve how to render a text block title in preview/edit (respects user heading choices). */
export const resolvePortfolioTextTitlePresentation = (
  item: Pick<PortfolioItem, "type" | "title" | "templateSectionTitle" | "portfolioEntryTitle">,
  options: { isNestedDetailView?: boolean } = {}
): PortfolioTextTitlePresentation => {
  const normalizedTitle = normalizePortfolioHtmlForRender(item.title || "");
  const storedLevel = extractTitleHeadingLevel(normalizedTitle);
  const innerHtml = storedLevel ? unwrapHeadingTagsFromTitleHtml(normalizedTitle) : normalizedTitle;

  if (item.type !== "text" || !normalizedTitle) {
    return { tag: "h3", html: "", useLargeTypography: false };
  }

  if (storedLevel) {
    return {
      tag: storedLevel,
      html: innerHtml,
      useLargeTypography: false,
    };
  }

  if (shouldDefaultTemplateSectionTitleToH1(item, options)) {
    return {
      tag: "h1",
      html: innerHtml,
      useLargeTypography: true,
    };
  }

  if (shouldDefaultPortfolioEntryTitleToH2(item, options)) {
    return {
      tag: "h2",
      html: innerHtml,
      useLargeTypography: false,
    };
  }

  return {
    tag: "h3",
    html: normalizedTitle,
    useLargeTypography: false,
  };
};

/** Wrap plain (or single bold-wrapped) title HTML in a semantic heading when missing. */
export const wrapPortfolioTitleWithHeadingLevel = (html: string, level: PortfolioTitleHeadingLevel): string => {
  const normalized = normalizePortfolioHtmlForRender(html).trim();
  if (!normalized) return "";
  if (extractTitleHeadingLevel(normalized)) return normalized;

  let inner = normalized;
  const singleBold = normalized.match(/^<(strong|b)>([\s\S]*)<\/\1>$/i);
  if (singleBold) {
    inner = singleBold[2].trim();
  }

  return `<${level}>${inner}</${level}>`;
};

/**
 * Materialize template heading semantics into stored title HTML (h1 section / h2 entry).
 * Used on portfolio load so RichTextEditor toolbar matches preview typography.
 */
export const resolvePortfolioTitleHtmlForItem = (
  item: Pick<PortfolioItem, "type" | "title" | "templateSectionTitle" | "portfolioEntryTitle">
): string | undefined => {
  if (item.type !== "text" || !item.title?.trim()) return item.title;

  const normalized = normalizePortfolioHtmlForRender(item.title);
  if (extractTitleHeadingLevel(normalized)) return normalized;

  if (item.templateSectionTitle === true) {
    return wrapPortfolioTitleWithHeadingLevel(normalized, "h1");
  }
  if (item.portfolioEntryTitle === true) {
    return wrapPortfolioTitleWithHeadingLevel(normalized, "h2");
  }

  return normalized;
};

/** Clear pipeline heading locks when the user picks a different heading level in the title field. */
export const buildPortfolioTitleUpdate = (
  item: Pick<PortfolioItem, "title" | "templateSectionTitle" | "portfolioEntryTitle">,
  nextTitle: string
): { title: string; templateSectionTitle?: false; portfolioEntryTitle?: false } => {
  const updates: { title: string; templateSectionTitle?: false; portfolioEntryTitle?: false } = {
    title: nextTitle,
  };

  const nextLevel = extractTitleHeadingLevel(nextTitle);

  if (item.templateSectionTitle && nextLevel !== "h1") {
    updates.templateSectionTitle = false;
  }

  if (item.portfolioEntryTitle && nextLevel !== "h2") {
    updates.portfolioEntryTitle = false;
  }

  return updates;
};

/** True when a text block has no visible title after normalization. */
export const isPortfolioTextTitleEmpty = (title?: string): boolean => {
  const plain = normalizePortfolioHtmlForRender(title || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return !plain;
};

/** True when a text block has no visible body content after normalization. */
export const isPortfolioTextContentEmpty = (content?: string): boolean => {
  const plain = normalizePortfolioHtmlForRender(content || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return !plain;
};

/** Text block with body content and no title — content-only tier in preview. */
export const isContentOnlyTextItem = (
  item: Pick<PortfolioItem, "type" | "title" | "content" | "isCollapsed" | "isCollapsible">
): boolean => {
  if (item.type !== "text") return false;
  if (item.isCollapsible && item.isCollapsed) return false;
  if (isPortfolioTextContentEmpty(item.content)) return false;
  return isPortfolioTextTitleEmpty(item.title);
};

/** Text block with a title and no body — section heading tier (template or user-created). */
export const isTitleOnlyTextItem = (item: Pick<PortfolioItem, "type" | "title" | "content" | "isCollapsed" | "isCollapsible">): boolean => {
  if (item.type !== "text") return false;
  if (item.isCollapsible && item.isCollapsed) return false;
  if (isPortfolioTextTitleEmpty(item.title)) return false;
  return isPortfolioTextContentEmpty(item.content);
};

/** Template-generated title-only block (section header / empty entry). Gated to template flags only. */
export const isTemplateTitleOnlyTextItem = (
  item: Pick<PortfolioItem, "type" | "title" | "content" | "templateSectionTitle" | "portfolioEntryTitle" | "isCollapsed" | "isCollapsible">
): boolean => {
  if (!isTitleOnlyTextItem(item)) return false;
  return Boolean(item.templateSectionTitle || item.portfolioEntryTitle);
};

/** Natural card height for a content-only block: p-6 (48) + one body line. */
export const estimateContentOnlyTextLayoutHeightPx = (): number => 48 + 28;

/** Natural card height for a title-only heading: standard p-6 (48) + one title line, by typography. */
export const estimateTitleOnlyTextLayoutHeightPx = (
  item: Pick<PortfolioItem, "type" | "title" | "templateSectionTitle" | "portfolioEntryTitle">
): number => {
  const presentation = resolvePortfolioTextTitlePresentation(item);
  const padding = 48;
  if (presentation.useLargeTypography) return padding + 36;
  if (presentation.tag === "h2") return padding + 32;
  return padding + 28;
};

/** Typography for text block titles from resolved presentation. */
export const portfolioSectionTitleClassName = (
  presentation: Pick<PortfolioTextTitlePresentation, "useLargeTypography" | "tag">
): string => {
  if (presentation.useLargeTypography || presentation.tag === "h1") {
    return "font-semibold text-2xl md:text-3xl tracking-tight text-slate-900 dark:text-white";
  }
  if (presentation.tag === "h2") {
    return "font-semibold text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white";
  }
  return "font-semibold text-lg text-slate-900 dark:text-white";
};
