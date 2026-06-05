/**
 * Detect when the user wants to generate a LinkedIn post draft from chat text.
 */
export type GenerateDraftRequest = {
  topic: string | null;
};

const GENERATE_DRAFT_PATTERN = /\bgenerate(?:\s+a|\s+another)?\s+draft\b/i;

export const isGenerateDraftRequest = (text: string): boolean => GENERATE_DRAFT_PATTERN.test(text);

export const parseGenerateDraftRequest = (text: string): GenerateDraftRequest | null => {
  if (!GENERATE_DRAFT_PATTERN.test(text)) {
    return null;
  }

  const quoted =
    text.match(/(?:topic|idea|for|about)\s*[:—-]?\s*["“]([^"”]+)["”]/i) ?? text.match(/(?:topic|idea|for|about)\s*[:—-]?\s*'([^']+)'/i);

  if (quoted?.[1]?.trim()) {
    return { topic: quoted[1].trim() };
  }

  const forClause = text.match(/\bgenerate\s+draft\s+for\s+([\s\S]+)$/i);
  if (forClause?.[1]) {
    const cleaned = forClause[1]
      .trim()
      .replace(/[.!?]+$/, "")
      .trim();
    if (cleaned.length > 0) {
      return { topic: cleaned };
    }
  }

  return { topic: null };
};
