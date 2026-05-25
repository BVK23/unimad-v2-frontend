export const TOPIC_DESCRIPTIONS: Record<string, string> = {
  "linkedin-post": "Craft and schedule LinkedIn posts that build your personal brand.",
  referral: "Ask for warm introductions with tailored referral messages.",
  "cover-letter": "Generate tailored cover letters for each application.",
  "cold-email": "Write professional outreach emails to hiring managers.",
  vpd: "Document your strengths with a clear value proposition.",
};

export const TOPIC_GROUPS: { topics: { id: string; label: string }[]; blueStroke: boolean }[] = [
  {
    topics: [
      { id: "linkedin-post", label: "LinkedIn Post" },
      { id: "referral", label: "Referral Request" },
    ],
    blueStroke: true,
  },
  {
    topics: [
      { id: "cover-letter", label: "Cover Letter" },
      { id: "cold-email", label: "Cold Email" },
      { id: "vpd", label: "Value Prop Doc" },
    ],
    blueStroke: false,
  },
];

export function getTopicMeta(topicId: string) {
  for (const group of TOPIC_GROUPS) {
    const found = group.topics.find(t => t.id === topicId);
    if (found) return found;
  }
  return { id: topicId, label: topicId };
}

export function getTopicDescription(topicId: string) {
  return TOPIC_DESCRIPTIONS[topicId] ?? "Generate high-quality application materials in seconds.";
}
