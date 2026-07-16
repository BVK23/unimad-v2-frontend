import type { ChatMessage } from "@/types";
import { describe, expect, it } from "vitest";
import { hydrateLoadedTopicMessages, shouldCollapseTopicsOnLoad } from "./hydrate-loaded-topics";

function topic(id: string): ChatMessage {
  return {
    id,
    role: "model",
    text: "",
    timestamp: new Date(),
    isTopic: true,
    topicTitle: id,
    messages: [],
  };
}

describe("shouldCollapseTopicsOnLoad", () => {
  it("always collapses sub-threads on load", () => {
    expect(shouldCollapseTopicsOnLoad(0)).toBe(true);
    expect(shouldCollapseTopicsOnLoad(1)).toBe(true);
    expect(shouldCollapseTopicsOnLoad(2)).toBe(true);
    expect(shouldCollapseTopicsOnLoad(5)).toBe(true);
  });
});

describe("hydrateLoadedTopicMessages", () => {
  it("collapses all topics regardless of count", () => {
    const messages = [topic("a"), topic("b")];
    const hydrated = hydrateLoadedTopicMessages(messages);
    expect(hydrated.every(m => m.isExpanded === false)).toBe(true);
  });
});
