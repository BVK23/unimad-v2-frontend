/** US-style letter date, e.g. June 17, 2025 */
export const formatCoverLetterDate = (date = new Date()): string =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const COVER_LETTER_DATE_PLACEHOLDER_RE = /\[(?:Today'?s?\s*)?Date\]/gi;

/** Replace common date placeholders left by the model with a concrete date. */
export const normalizeCoverLetterDatePlaceholders = (content: string, letterDate = formatCoverLetterDate()): string =>
  content.replace(COVER_LETTER_DATE_PLACEHOLDER_RE, letterDate);
