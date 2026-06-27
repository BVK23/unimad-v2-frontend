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
  it("keeps 1–2 sub-threads expanded on load", () => {
    expect(shouldCollapseTopicsOnLoad(1)).toBe(false);
    expect(shouldCollapseTopicsOnLoad(2)).toBe(false);
  });

  it("collapses when more than two sub-threads", () => {
    expect(shouldCollapseTopicsOnLoad(3)).toBe(true);
    expect(shouldCollapseTopicsOnLoad(5)).toBe(true);
  });
});

describe("hydrateLoadedTopicMessages", () => {
  it("collapses all topics when count exceeds threshold", () => {
    const messages = [topic("a"), topic("b"), topic("c")];
    const hydrated = hydrateLoadedTopicMessages(messages);
    expect(hydrated.every(m => m.isExpanded === false)).toBe(true);
  });

  it("expands all topics when count is within threshold", () => {
    const messages = [topic("a"), topic("b")];
    const hydrated = hydrateLoadedTopicMessages(messages);
    expect(hydrated.every(m => m.isExpanded === true)).toBe(true);
  });
});
