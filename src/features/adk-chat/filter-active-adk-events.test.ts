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

function texts(active: AdkEvent[]): Array<string | undefined> {
  return active.map(e => (e.content?.parts?.[0] as { text?: string } | undefined)?.text);
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

    expect(texts(filterActiveAdkEvents(events))).toEqual(["Tailor Vinutna", "suggest jobs again", "prepare resume for Meubles"]);
  });

  it("applies stacked rewinds so earlier discarded edit branches do not leak back", () => {
    // User edited the same ATS question three times (exactly the refresh bug).
    const events = [
      event({ id: "u1", invocationId: "inv-a", text: "prior context" }),
      event({ id: "a1", invocationId: "inv-a", text: "prior reply" }),
      event({ id: "u2", invocationId: "inv-b", text: "ATS score is low? (v1)" }),
      event({ id: "a2", invocationId: "inv-b", text: "ATS analysis v1" }),
      event({ id: "rw1", invocationId: "inv-rw1", rewindBefore: "inv-b" }),
      event({ id: "u3", invocationId: "inv-c", text: "ATS score is low? (v2)" }),
      event({ id: "a3", invocationId: "inv-c", text: "ATS analysis v2" }),
      event({ id: "rw2", invocationId: "inv-rw2", rewindBefore: "inv-c" }),
      event({ id: "u4", invocationId: "inv-d", text: "ATS score is low? (v3)" }),
      event({ id: "a4", invocationId: "inv-d", text: "ATS analysis v3" }),
    ];

    expect(texts(filterActiveAdkEvents(events))).toEqual(["prior context", "prior reply", "ATS score is low? (v3)", "ATS analysis v3"]);
  });

  it("handles rewind markers that use snake_case action fields", () => {
    const events = [
      event({ id: "1", invocationId: "inv-a", text: "keep" }),
      event({ id: "2", invocationId: "inv-b", text: "drop" }),
      {
        id: "rw",
        invocationId: "inv-rw",
        author: "user",
        timestamp: Date.now() / 1000,
        actions: { rewind_before_invocation_id: "inv-b" },
      } as AdkEvent,
      event({ id: "3", invocationId: "inv-c", text: "new branch" }),
    ];

    expect(texts(filterActiveAdkEvents(events))).toEqual(["keep", "new branch"]);
  });
});
