import { describe, expect, it } from "vitest";
import { filterActiveAdkEvents } from "./filter-active-adk-events";
import type { AdkEvent } from "./types";

function event(partial: { id: string; invocationId: string; text?: string; rewindBefore?: string }): AdkEvent {
  return {
    id: partial.id,
    invocationId: partial.invocationId,
    author: "user",
    timestamp: Date.now() / 1000,
    content: partial.text ? { role: "user", parts: [{ text: partial.text }] } : undefined,
    actions: partial.rewindBefore ? { rewindBeforeInvocationId: partial.rewindBefore } : undefined,
  } as AdkEvent;
}

describe("filterActiveAdkEvents", () => {
  it("keeps full history when there is no rewind marker", () => {
    const events = [event({ id: "1", invocationId: "inv-a", text: "first" }), event({ id: "2", invocationId: "inv-b", text: "second" })];
    expect(filterActiveAdkEvents(events)).toHaveLength(2);
  });

  it("drops the rewound branch but keeps later continued chat", () => {
    const events = [
      event({ id: "1", invocationId: "inv-a", text: "Tailor Vinutna" }),
      event({ id: "2", invocationId: "inv-b", text: "suggest jobs (bad turn)" }),
      event({ id: "rw", invocationId: "inv-rw", rewindBefore: "inv-b" }),
      event({ id: "3", invocationId: "inv-c", text: "suggest jobs again" }),
      event({ id: "4", invocationId: "inv-d", text: "prepare resume for Meubles" }),
    ];

    const active = filterActiveAdkEvents(events);
    const texts = active.map(e => (e.content?.parts?.[0] as { text?: string } | undefined)?.text);

    expect(texts).toEqual(["Tailor Vinutna", "suggest jobs again", "prepare resume for Meubles"]);
  });
});
