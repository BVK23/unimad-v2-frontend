import { describe, expect, it } from "vitest";
import { collapseSimilarConsecutiveAiMessages, shouldMergeSimilarAiMessages } from "./collapse-similar-consecutive-ai-messages";
import type { AgentMessage } from "./types";

function ai(id: string, content: string): AgentMessage {
  return { id, type: "ai", content, timestamp: new Date() };
}

function human(id: string, content: string): AgentMessage {
  return { id, type: "human", content, timestamp: new Date() };
}

describe("shouldMergeSimilarAiMessages", () => {
  it("merges identical and prefix-extension copies", () => {
    expect(shouldMergeSimilarAiMessages("I'll update your summary.", "I'll update your summary. Done.")).toBe(true);
    expect(shouldMergeSimilarAiMessages("Same text", "Same text")).toBe(true);
  });

  it("does not merge clearly different replies", () => {
    expect(shouldMergeSimilarAiMessages("I'll route you to the resume specialist.", "Here are three jobs that match your profile.")).toBe(
      false
    );
  });
});

describe("collapseSimilarConsecutiveAiMessages", () => {
  it("keeps only the latest similar AI bubble per user turn", () => {
    const messages = [
      human("u1", "Improve my summary"),
      ai("a1", "I'll read your resume and update the summary."),
      ai("a2", "I'll read your resume and update the summary."),
      ai("a3", "I'll read your resume and update the summary. Review the highlighted changes."),
      human("u2", "Thanks"),
    ];

    const collapsed = collapseSimilarConsecutiveAiMessages(messages);
    expect(collapsed).toHaveLength(3);
    expect(collapsed[1].id).toBe("a3");
    expect(collapsed[1].content).toContain("Review the highlighted changes");
  });

  it("preserves multiple distinct AI bubbles in one turn", () => {
    const messages = [
      human("u1", "Find me jobs"),
      ai("a1", "I'll hand this to the job board agent."),
      ai("a2", "Here are five roles that fit your background."),
    ];

    const collapsed = collapseSimilarConsecutiveAiMessages(messages);
    expect(collapsed).toHaveLength(3);
    expect(collapsed.map(m => m.id)).toEqual(["u1", "a1", "a2"]);
  });
});
