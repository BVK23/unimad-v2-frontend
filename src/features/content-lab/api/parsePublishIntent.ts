/**
 * Detect when the user wants to post or schedule a LinkedIn post from chat text.
 */
export type PublishIntent = {
  mode: "post_now" | "schedule";
  scheduledAt?: string;
};

const POST_NOW_PATTERNS = [
  /\bpost\s+(?:it\s+)?(?:on|to)\s+linkedin\b/i,
  /\bpublish\s+(?:this|it|the\s+post)?\s*(?:on\s+linkedin|to\s+linkedin|now)?\b/i,
  /\bpost\s+now\b/i,
  /\bpost\s+this\s+(?:on\s+)?linkedin\b/i,
  /\bshare\s+(?:it\s+)?on\s+linkedin\b/i,
];

const SCHEDULE_PATTERNS = [
  /\bschedule\s+(?:this\s+)?(?:linkedin\s+)?(?:post|it)\b/i,
  /\bschedule\s+.{0,60}\blinkedin\b/i,
  /\bpost\s+(?:it\s+)?(?:later|tomorrow)\b/i,
  /\bschedule\s+(?:for\s+)?(?:tomorrow|later|today)\b/i,
  /\bschedule\s+(?:for\s+)?(?:today|tomorrow)\s+(?:at|for)\s+\d/i,
];

const parseTimeFromText = (text: string): { hours: number; minutes: number } | null => {
  const forAtMatch =
    text.match(/\b(?:for|at)\s+(\d{1,2}):(\d{2})\s*(am|pm)\b/i) ??
    text.match(/\b(?:for|at)\s+(\d{1,2}):(\d{2})(am|pm)\b/i) ??
    text.match(/\b(?:for|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  const colonMatch = text.match(/\b(\d{1,2}):(\d{2})(am|pm)\b/i) ?? text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  const match = forAtMatch ?? colonMatch;
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && hours <= 12 && /\bpm\b/i.test(text) && hours < 12) hours += 12;
  if (!meridiem && hours <= 12 && /\bam\b/i.test(text) && hours === 12) hours = 0;

  return { hours, minutes };
};

const parseScheduledAtFromText = (text: string): string | undefined => {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\b/i);
  if (isoMatch?.[1]) {
    const parsed = new Date(isoMatch[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const time = parseTimeFromText(text);
  const isToday = /\b(?:for\s+)?today\b/i.test(text);
  const isTomorrow = /\btomorrow\b/i.test(text);

  if (isToday || isTomorrow) {
    const date = new Date();
    if (isTomorrow) {
      date.setDate(date.getDate() + 1);
    }
    if (time) {
      date.setHours(time.hours, time.minutes, 0, 0);
    } else {
      date.setHours(9, 0, 0, 0);
    }
    return date.toISOString();
  }

  if (time && /\b(?:this\s+)?(?:evening|afternoon|morning)\b/i.test(text)) {
    const date = new Date();
    date.setHours(time.hours, time.minutes, 0, 0);
    return date.toISOString();
  }

  return undefined;
};

export const parsePublishIntent = (text: string): PublishIntent | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (SCHEDULE_PATTERNS.some(p => p.test(trimmed))) {
    return {
      mode: "schedule",
      scheduledAt: parseScheduledAtFromText(trimmed),
    };
  }

  if (POST_NOW_PATTERNS.some(p => p.test(trimmed))) {
    return { mode: "post_now" };
  }

  return null;
};
