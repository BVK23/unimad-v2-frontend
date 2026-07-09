/**
 * Convert displayed bot message markdown/HTML to plain text for clipboard copy.
 * Expects content that already had machine-readable JSON payloads stripped.
 */
export function botMessageToPlainTextCopy(content: string): string {
  let text = content.trim();
  if (!text) {
    return "";
  }

  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, inner: string) => inner.trim());
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^>\s?/gm, "");
  text = text.replace(/^[\s]*[-*+]\s+/gm, "• ");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
