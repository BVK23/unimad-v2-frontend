/**
 * Prepare portfolio HTML from migration or RichTextEditor for rendering.
 * BlockNote → v2 conversion entity-encodes inline markup inside segments, so tags like
 * &lt;br&gt; and &lt;em&gt; can appear literally unless decoded before innerHTML.
 */
const ENTITY_ENCODED_TAG_NAMES = ["br", "em", "strong", "b", "i", "u", "p", "ul", "ol", "li"] as const;

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
