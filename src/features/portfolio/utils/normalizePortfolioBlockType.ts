import type { ContentType } from "@/types";

const CONTENT_TYPES = new Set<ContentType>([
  "text",
  "image",
  "video",
  "link",
  "project",
  "code",
  "service",
  "collapsible",
  "media",
  "link-box",
  "page-card",
  "table",
  "embed",
  "box",
]);

/** Maps agent/UI aliases to canonical portfolio block types. */
const BLOCK_TYPE_ALIASES: Record<string, ContentType> = {
  "embed-code": "embed",
  embed_code: "embed",
  embedcode: "embed",
  "figma-embed": "embed",
  figma_embed: "embed",
  linkbox: "link-box",
  "link-box": "link-box",
  pagecard: "page-card",
  "page-card": "page-card",
  page: "page-card",
};

export const normalizePortfolioBlockType = (raw: unknown): ContentType => {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");

  if (BLOCK_TYPE_ALIASES[key]) {
    return BLOCK_TYPE_ALIASES[key];
  }

  if (CONTENT_TYPES.has(key as ContentType)) {
    return key as ContentType;
  }

  return "text";
};

type BlockTypeHints = {
  type?: unknown;
  content?: string;
  variant?: string;
  title?: string;
};

/** Resolves agent/UI mislabels (e.g. type `code` for an embed-code block). */
export const resolvePortfolioBlockType = (item: BlockTypeHints): ContentType => {
  const base = normalizePortfolioBlockType(item.type);
  if (base !== "code") {
    return base;
  }

  const content = (item.content ?? "").trim();
  const title = (item.title ?? "").toLowerCase();
  const variant = (item.variant ?? "").toLowerCase();

  if (variant === "figma" || variant === "code") {
    return "embed";
  }
  if (title.includes("embed")) {
    return "embed";
  }
  if (/<iframe[\s>]/i.test(content) || /^<html[\s>]/i.test(content)) {
    return "embed";
  }

  return "code";
};
