/** User-facing copy for the first turn in the LinkedIn Topic sidebar thread. */

export const CONTENT_GEN_TOPIC_USER_DISPLAY = "Help me choose a LinkedIn post topic.";

export const buildContentGenTopicBootstrap = (seedTopic?: string): string => {
  const trimmed = seedTopic?.trim();
  if (!trimmed) {
    return CONTENT_GEN_TOPIC_USER_DISPLAY;
  }
  return `Help me choose a LinkedIn post topic. I'm starting with this idea: "${trimmed}".`;
};

export const buildContentGenDraftBootstrap = (topic: string): string => {
  const trimmed = topic.trim();
  if (!trimmed) {
    return "Write the full LinkedIn post draft for my chosen topic.";
  }
  return `Write the full LinkedIn post draft for my topic: "${trimmed}".`;
};

/** Map stored message text to friendly UI (covers older sessions with technical bootstrap). */
export const contentGenTopicUserDisplayText = (sentText: string): string => {
  if (
    sentText.includes("get_content_gen_context") ||
    sentText.includes("fetch_user_personal_details") ||
    sentText.includes("affirmation chips")
  ) {
    const seedMatch =
      sentText.match(/starting idea:\s*"([^"]+)"/i) ??
      sentText.match(/idea:\s*"([^"]+)"/i) ??
      sentText.match(/starting with this idea:\s*"([^"]+)"/i);
    if (seedMatch?.[1]) {
      return `Help me choose a LinkedIn post topic. I'm starting with this idea: "${seedMatch[1]}".`;
    }
    return CONTENT_GEN_TOPIC_USER_DISPLAY;
  }
  return sentText;
};
