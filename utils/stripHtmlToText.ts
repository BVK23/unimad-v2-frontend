/** Decode common entities then strip tags — for titles shown outside rich-text editors. */
export function stripHtmlToText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    })
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
