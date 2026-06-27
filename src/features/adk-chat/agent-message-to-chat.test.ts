import { describe, expect, it } from "vitest";
import { agentMessageToChatMessage } from "./agent-message-to-chat";
import type { AgentMessage } from "./types";

describe("agentMessageToChatMessage", () => {
  it("preserves LinkedIn suggestion payloads from enriched agent messages", () => {
    const agentMessage: AgentMessage = {
      id: "assistant-1",
      type: "ai",
      content: "You'll find three copy-ready headline variants in the Unimad sidebar.",
      timestamp: new Date(1),
      invocationId: "inv-1",
      unimadLinkedInSuggestions: {
        section: "headline",
        headlineVariants: ["Option A", "Option B", "Option C"],
        linkedinEditHint: "Open your profile and edit the Headline field.",
        guideImageUrl: "/linkedin-guide/edit-headline.png?v=2",
      },
    };

    const chatMessage = agentMessageToChatMessage(agentMessage);

    expect(chatMessage.unimadLinkedInSuggestions?.section).toBe("headline");
    expect(chatMessage.unimadLinkedInSuggestions?.headlineVariants).toHaveLength(3);
    expect(chatMessage.unimadLinkedInSuggestions?.guideImageUrl).toContain("edit-headline");
  });
});
