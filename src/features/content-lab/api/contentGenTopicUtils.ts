/** Compare LinkedIn post topics for draft routing (case-insensitive, trimmed). */
export const contentGenTopicsEqual = (a: string, b: string): boolean => {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};

export const truncateContentGenTopic = (topic: string, maxLen = 72): string => {
  const trimmed = topic.trim();
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
};

const META_CHIP_LABELS = new Set([
  "linkedin post",
  "linkedin",
  "post",
  "content lab",
  "studio",
  "top",
  "middle",
  "bottom",
  "top funnel",
  "middle funnel",
  "bottom funnel",
  "top of funnel",
  "middle of funnel",
  "bottom of funnel",
  "generate draft",
  "generate a draft",
  "generate another draft",
  "post now",
  "schedule",
  "yes",
  "no",
  "ok",
  "sure",
]);

const META_CHIP_PATTERNS: RegExp[] = [
  /^(top|middle|bottom)(\s+funnel)?$/i,
  /^(share|tell|signal|show)\b/i,
  /^(thought leadership|expertise|authenticity|open to roles?)\b/i,
  /^(skill application|project story|career pivot|behind the scenes)\b/i,
  /\bgenerate(?:\s+a|\s+another)?\s+draft\b/i,
  /^help me choose a linkedin post topic/i,
  /^write the full linkedin post draft/i,
  /\bpick on your own\b/i,
  /\bpick (one|a topic|for me|yourself)\b/i,
  /\bchoose (one|a topic|for me|yourself|on your own)\b/i,
  /\byou (pick|choose|decide)\b/i,
  /\bdecide (for me|on your own|yourself)\b/i,
  /\bsurprise me\b/i,
  /\bany (one|topic)\b/i,
  /\bwhichever you (think|prefer|like)\b/i,
  /^just pick\b/i,
  /\bpick.*\band generate draft\b/i,
  /\bchoose.*\band generate draft\b/i,
];

/** User asked the agent to select a topic (not supplying a title themselves). */
export const isContentGenUserInstructionMessage = (text: string): boolean => {
  return isContentGenMetaChipLabel(text);
};

/** User chip / routing labels that are not post topic titles. */
export const isContentGenMetaChipLabel = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  if (META_CHIP_LABELS.has(lower)) {
    return true;
  }
  return META_CHIP_PATTERNS.some(pattern => pattern.test(trimmed));
};

/** Keep only strings that look like real topic titles, not funnel/type chips. */
export const isValidContentGenTopicTitle = (text: string): boolean => {
  const trimmed = text.trim();
  if (trimmed.length < 8) {
    return false;
  }
  return !isContentGenMetaChipLabel(trimmed);
};

/**
 * Derive a concise topic title from draft body when ADK did not supply one.
 * Prefers bold project names, then "building X" phrases, then a short first clause.
 */
export const inferTopicFromDraftText = (draft: string): string | null => {
  const trimmed = draft.trim();
  if (!trimmed) {
    return null;
  }

  const boldMatch = trimmed.match(/\*\*([^*]{4,90})\*\*/);
  if (boldMatch?.[1]?.trim() && isValidContentGenTopicTitle(boldMatch[1])) {
    return boldMatch[1].trim();
  }

  const buildingMatch = trimmed.match(/\bbuilding\s+([A-Z][\w\s.'-]{2,70}?)(?:\s+was|\s+is|\s+has|,|\.)/);
  if (buildingMatch?.[1]?.trim()) {
    const candidate = buildingMatch[1].trim();
    if (isValidContentGenTopicTitle(candidate)) {
      return candidate;
    }
  }

  const firstLine = trimmed.split(/\n/)[0]?.replace(/[#*_]/g, "").trim() ?? "";
  if (firstLine.length >= 20) {
    const clause = firstLine.split(/[.!?]/)[0]?.trim() ?? "";
    if (clause.length >= 12 && clause.length <= 100 && isValidContentGenTopicTitle(clause)) {
      return clause;
    }
  }

  const subjectOpener = trimmed.match(/^([A-Z][a-zA-Z0-9.+#]+)\b/);
  if (subjectOpener?.[1] && subjectOpener[1].length >= 4) {
    const subject = subjectOpener[1];
    const count = (trimmed.match(new RegExp(`\\b${subject}\\b`, "gi")) ?? []).length;
    if (count >= 2) {
      const shortTopic = `${subject} in modern development`;
      if (isValidContentGenTopicTitle(shortTopic)) {
        return shortTopic;
      }
    }
  }

  return null;
};
