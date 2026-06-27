import { describe, expect, it } from "vitest";
import { enrichAgentMessagesFromToolEvents } from "./enrich-messages-from-tool-events";
import type { AdkEvent, AgentMessage } from "./types";

describe("enrichAgentMessagesFromToolEvents", () => {
  it("attaches job cards and navigation from persisted tool responses", () => {
    const invocationId = "inv-1";
    const assistantMessageId = "assistant-1";

    const events: AdkEvent[] = [
      {
        id: "user-1",
        author: "user",
        invocationId,
        timestamp: 1,
        content: {
          role: "user",
          parts: [{ text: "What jobs suit me?" }],
        },
      },
      {
        id: "tool-1",
        author: "job_board_agent",
        invocationId,
        timestamp: 2,
        content: {
          role: "model",
          parts: [
            {
              function_response: {
                id: "fr-1",
                name: "fetch_recommended_jobs",
                response: {
                  status: "ok",
                  query_used: "Data Engineer",
                  jobs: [
                    {
                      id: "job-1",
                      title: "Data Engineer",
                      company: "Acme",
                      location: "London",
                    },
                  ],
                  ui: {
                    job_cards: [{ id: "job-1", title: "Data Engineer", company: "Acme", location: "London" }],
                    navigation: { path: "/uniboard/jobs", label: "See more on Job Board" },
                  },
                },
              },
            },
          ],
        },
      },
      {
        id: assistantMessageId,
        author: "job_board_agent",
        invocationId,
        timestamp: 3,
        content: {
          role: "model",
          parts: [{ text: "Here are some Data Engineer roles for you." }],
        },
      },
    ];

    const messages: AgentMessage[] = [
      {
        id: "user-1",
        type: "human",
        content: "What jobs suit me?",
        timestamp: new Date(1),
        invocationId,
      },
      {
        id: assistantMessageId,
        type: "ai",
        content: "Here are some Data Engineer roles for you.",
        timestamp: new Date(3),
      },
    ];

    const enriched = enrichAgentMessagesFromToolEvents(messages, events);
    const assistant = enriched.find(m => m.id === assistantMessageId);

    expect(assistant?.unimadJobCards?.jobs).toHaveLength(1);
    expect(assistant?.unimadJobCards?.jobs[0]?.role).toBe("Data Engineer");
    expect(assistant?.unimadJobCards?.seeMorePath).toBe("/uniboard/jobs");
  });

  it("attaches standalone navigation tool responses", () => {
    const invocationId = "inv-2";
    const assistantMessageId = "assistant-2";

    const events: AdkEvent[] = [
      {
        id: "user-2",
        author: "user",
        invocationId,
        timestamp: 10,
        content: { role: "user", parts: [{ text: "Open job board" }] },
      },
      {
        id: "tool-2",
        author: "unibot",
        invocationId,
        timestamp: 11,
        content: {
          role: "model",
          parts: [
            {
              function_response: {
                id: "fr-2",
                name: "suggest_unimad_navigation",
                response: {
                  status: "ok",
                  path: "/uniboard/jobs",
                  label: "Go to Job Board",
                },
              },
            },
          ],
        },
      },
      {
        id: assistantMessageId,
        author: "unibot",
        invocationId,
        timestamp: 12,
        content: { role: "model", parts: [{ text: "Use the button below." }] },
      },
    ];

    const messages: AgentMessage[] = [
      {
        id: "user-2",
        type: "human",
        content: "Open job board",
        timestamp: new Date(10),
        invocationId,
      },
      {
        id: assistantMessageId,
        type: "ai",
        content: "Use the button below.",
        timestamp: new Date(12),
      },
    ];

    const enriched = enrichAgentMessagesFromToolEvents(messages, events);
    const assistant = enriched.find(m => m.id === assistantMessageId);

    expect(assistant?.unimadNavigation).toEqual({
      path: "/uniboard/jobs",
      label: "Go to Job Board",
    });
  });

  it("attaches LinkedIn suggestions from present_linkedin_suggestions tool responses", () => {
    const invocationId = "inv-3";
    const assistantMessageId = "assistant-3";

    const events: AdkEvent[] = [
      {
        id: "user-3",
        author: "user",
        invocationId,
        timestamp: 20,
        content: {
          role: "user",
          parts: [{ text: "yes please" }],
        },
      },
      {
        id: "tool-3",
        author: "linkedin_headline_agent",
        invocationId,
        timestamp: 21,
        content: {
          role: "model",
          parts: [
            {
              function_response: {
                id: "fr-3",
                name: "present_linkedin_suggestions",
                response: {
                  status: "ok",
                  section: "headline",
                  ui: {
                    linkedin_suggestions: {
                      section: "headline",
                      headline_variants: ["Headline A", "Headline B", "Headline C"],
                      linkedin_edit_hint: "Click the pencil icon near your cover photo.",
                      guide_image_url: "/linkedin-guide/edit-headline.png?v=2",
                    },
                  },
                },
              },
            },
          ],
        },
      },
      {
        id: assistantMessageId,
        author: "linkedin_headline_agent",
        invocationId,
        timestamp: 22,
        content: {
          role: "model",
          parts: [{ text: "You'll find three copy-ready headline variants in the Unimad sidebar." }],
        },
      },
    ];

    const messages: AgentMessage[] = [
      {
        id: "user-3",
        type: "human",
        content: "yes please",
        timestamp: new Date(20),
        invocationId,
      },
      {
        id: assistantMessageId,
        type: "ai",
        content: "You'll find three copy-ready headline variants in the Unimad sidebar.",
        timestamp: new Date(22),
      },
    ];

    const enriched = enrichAgentMessagesFromToolEvents(messages, events);
    const assistant = enriched.find(m => m.id === assistantMessageId);

    expect(assistant?.unimadLinkedInSuggestions?.section).toBe("headline");
    expect(assistant?.unimadLinkedInSuggestions?.headlineVariants).toEqual(["Headline A", "Headline B", "Headline C"]);
    expect(assistant?.unimadLinkedInSuggestions?.guideImageUrl).toContain("edit-headline");
  });
});
