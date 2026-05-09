export const htmlToPlainText = (input: string) => {
  if (!input) return "";

  // If it doesn't look like HTML, just return as-is
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(input);
  if (!looksLikeHtml) return input;

  // Browser path: decode entities and preserve basic line breaks
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const withBreaks = input
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*p\s*>/gi, "\n")
      .replace(/<\/\s*li\s*>/gi, "\n")
      .replace(/<\/\s*div\s*>/gi, "\n");

    const doc = new DOMParser().parseFromString(withBreaks, "text/html");
    return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
  }

  // Fallback: strip tags
  return input
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
