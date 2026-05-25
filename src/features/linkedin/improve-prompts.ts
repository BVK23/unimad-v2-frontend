import type { UnibotLinkedInSection } from "@/components/chat/unibot-incoming-request";
import type { LinkedInSectionId } from "@/src/features/linkedin/constants";

const SECTION_LABELS: Record<UnibotLinkedInSection, string> = {
  pic: "profile picture",
  cover: "cover image",
  headline: "headline",
  about: "about section",
  experience: "experience",
  skills: "skills",
  connection: "connection request",
  comment: "comment",
};

/** Map dashboard section id → ADK / Unibot section key. */
export function linkedInSectionIdToAdkSection(sectionId: string): UnibotLinkedInSection | undefined {
  const id = sectionId.trim().toLowerCase();
  if (id === "exp") return "experience";
  if (id === "pic" || id === "cover" || id === "headline" || id === "about" || id === "skills") {
    return id;
  }
  return undefined;
}

/** Short user message — score, feedback, and tip live in session state (PATCH), not the chat turn. */
export function buildLinkedInImproveMessage(section: UnibotLinkedInSection): string {
  const label = SECTION_LABELS[section];
  return `Improve my LinkedIn ${label}.`;
}

export function buildLinkedInImproveMessageFromSectionId(sectionId: LinkedInSectionId | string): string {
  const adkSection = linkedInSectionIdToAdkSection(sectionId);
  if (!adkSection) {
    return "Improve my LinkedIn profile. Use session tools for context.";
  }
  return buildLinkedInImproveMessage(adkSection);
}
