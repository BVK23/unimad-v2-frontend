/**
 * Detect when the user wants LinkedIn post topic planning (Studio Content Gen).
 * Routes main-chat prompts into the isolated LinkedIn Topic thread with chips.
 */
export type ContentGenTopicIntent = {
  seedTopic?: string;
};

const GENERATE_DRAFT_PATTERN = /\bgenerate\s+draft\b/i;

const TOPIC_INTENT_PATTERNS = [
  /\blinkedin\b.*\b(post\s+)?topic\b/i,
  /\b(post\s+)?topic\b.*\blinkedin\b/i,
  /\bwhat should i post\b/i,
  /\bhelp me (choose|pick|find|plan).*(linkedin|post).*topic\b/i,
  /\b(come up with|suggest|brainstorm|plan).*(linkedin|post).*(topic|idea)/i,
  /\b(come up with|suggest|brainstorm).*\btopic\b/i,
  /\blinkedin post idea\b/i,
  /\bcontent lab\b.*\btopic\b/i,
];

const extractSeedTopic = (text: string): string | undefined => {
  const quoted =
    text.match(/(?:topic|idea|about|on)\s*[:—-]?\s*[""]([^""]+)[""]/i) ?? text.match(/(?:topic|idea|about|on)\s*[:—-]?\s*'([^']+)'/i);

  if (quoted?.[1]?.trim()) {
    return quoted[1].trim();
  }
  return undefined;
};

export const parseContentGenTopicIntent = (text: string): ContentGenTopicIntent | null => {
  const trimmed = text.trim();
  if (!trimmed || GENERATE_DRAFT_PATTERN.test(trimmed)) {
    return null;
  }

  if (!TOPIC_INTENT_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return null;
  }

  return { seedTopic: extractSeedTopic(trimmed) };
};
