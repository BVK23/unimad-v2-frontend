import type { ChatMessage } from "@/types";
import { describe, expect, it } from "vitest";
import { insertTopicInMainThread, messageSortTime, sortMainThreadChronologically, updateTopicInMainThread } from "./improve-topic-helpers";

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, "id" | "role" | "timestamp">): ChatMessage {
  return {
    text: "",
    ...partial,
  };
}

function topic(id: string, createdAt: Date, nested: Array<{ id: string; at: Date }> = []): ChatMessage {
  return msg({
    id,
    role: "model",
    timestamp: createdAt,
    isTopic: true,
    topicTitle: id,
    messages: nested.map(n => msg({ id: n.id, role: "user", text: n.id, timestamp: n.at })),
  });
}

describe("messageSortTime", () => {
  it("uses nested last activity for topic cards", () => {
    const created = new Date("2026-07-01T10:00:00Z");
    const last = new Date("2026-07-01T12:00:00Z");
    const t = topic("topic-a", created, [
      { id: "n1", at: new Date("2026-07-01T11:00:00Z") },
      { id: "n2", at: last },
    ]);
    expect(messageSortTime(t)).toBe(last.getTime());
  });

  it("falls back to card timestamp when nested is empty", () => {
    const created = new Date("2026-07-01T10:00:00Z");
    expect(messageSortTime(topic("topic-a", created))).toBe(created.getTime());
  });
});

describe("sortMainThreadChronologically", () => {
  it("places a subthread by last nested activity among main messages", () => {
    const welcome = msg({ id: "welcome", role: "model", text: "hi", timestamp: new Date("2026-07-01T09:00:00Z") });
    const m1 = msg({ id: "m1", role: "user", text: "one", timestamp: new Date("2026-07-01T10:00:00Z") });
    const m2 = msg({ id: "m2", role: "user", text: "two", timestamp: new Date("2026-07-01T11:00:00Z") });
    const m3 = msg({ id: "m3", role: "user", text: "three", timestamp: new Date("2026-07-01T13:00:00Z") });
    const sub = topic("topic-sub", new Date("2026-07-01T09:30:00Z"), [{ id: "s1", at: new Date("2026-07-01T12:00:00Z") }]);

    const sorted = sortMainThreadChronologically([welcome, m3, sub, m1, m2]);
    expect(sorted.map(m => m.id)).toEqual(["welcome", "m1", "m2", "topic-sub", "m3"]);
  });
});

describe("updateTopicInMainThread", () => {
  it("re-sorts so a newly active subthread crawls past older main messages", () => {
    const m1 = msg({ id: "m1", role: "user", text: "one", timestamp: new Date("2026-07-01T10:00:00Z") });
    const m2 = msg({ id: "m2", role: "user", text: "two", timestamp: new Date("2026-07-01T11:00:00Z") });
    const sub = topic("topic-sub", new Date("2026-07-01T09:30:00Z"), [{ id: "s1", at: new Date("2026-07-01T10:30:00Z") }]);

    const next = updateTopicInMainThread([m1, sub, m2], "topic-sub", t => ({
      ...t,
      messages: [...(t.messages ?? []), msg({ id: "s2", role: "user", text: "newer", timestamp: new Date("2026-07-01T12:00:00Z") })],
    }));

    expect(next.map(m => m.id)).toEqual(["m1", "m2", "topic-sub"]);
  });
});

describe("insertTopicInMainThread", () => {
  it("inserts by nested activity rather than always appending", () => {
    const m1 = msg({ id: "m1", role: "user", text: "one", timestamp: new Date("2026-07-01T10:00:00Z") });
    const m2 = msg({ id: "m2", role: "user", text: "two", timestamp: new Date("2026-07-01T12:00:00Z") });
    const sub = topic("topic-sub", new Date("2026-07-01T09:00:00Z"), [{ id: "s1", at: new Date("2026-07-01T11:00:00Z") }]);

    const next = insertTopicInMainThread([m1, m2], sub);
    expect(next.map(m => m.id)).toEqual(["m1", "topic-sub", "m2"]);
  });
});
