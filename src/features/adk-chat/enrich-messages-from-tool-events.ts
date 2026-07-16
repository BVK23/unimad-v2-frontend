import { filterActiveAdkEvents, getEventInvocationId } from "./filter-active-adk-events";
import { parseJobCardsFromToolResponse } from "./parse-unimad-job-cards";
import type { UnimadJobCardsPayload } from "./parse-unimad-job-cards";
import { parseLinkedInSuggestionsFromToolResponse } from "./parse-unimad-linkedin-suggestions";
import type { UnimadLinkedInSuggestionsPayload } from "./parse-unimad-linkedin-suggestions";
import { parseUnimadNavigationFromToolResponse } from "./parse-unimad-navigation";
import { toSnakeToolKey } from "./streaming/stream-activity";
import type { AdkContent, AdkEvent, AgentMessage } from "./types";

type ToolEnrichment = {
  unimadJobCards?: UnimadJobCardsPayload;
  unimadNavigation?: { path: string; label: string };
  unimadLinkedInSuggestions?: UnimadLinkedInSuggestionsPayload;
};

function parseEventContent(event: AdkEvent): AdkContent | null {
  if (typeof event.content === "string") {
    try {
      const parsed = JSON.parse(event.content) as AdkContent;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  if (event.content && typeof event.content === "object" && "parts" in event.content) {
    return event.content as AdkContent;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractFunctionResponses(event: AdkEvent): Array<{ name: string; response: Record<string, unknown> }> {
  const content = parseEventContent(event);
  if (!content?.parts?.length) return [];

  const out: Array<{ name: string; response: Record<string, unknown> }> = [];
  for (const part of content.parts) {
    if (!part || typeof part !== "object") continue;
    const record = part as Record<string, unknown>;
    const raw = record.function_response ?? record.functionResponse;
    const fr = asRecord(raw);
    if (!fr) continue;
    const name = typeof fr.name === "string" ? fr.name.trim() : "";
    if (!name) continue;
    const response = asRecord(fr.response) ?? {};
    out.push({ name, response });
  }
  return out;
}

function hasModelText(event: AdkEvent): boolean {
  const content = parseEventContent(event);
  if (!content || content.role !== "model") return false;
  return (content.parts ?? []).some(part => {
    if (!part || typeof part !== "object") return false;
    const record = part as Record<string, unknown>;
    return typeof record.text === "string" && record.text.trim().length > 0 && !record.thought;
  });
}

function mergeToolEnrichment(current: ToolEnrichment, name: string, response: Record<string, unknown>): ToolEnrichment {
  const next = { ...current };
  const key = toSnakeToolKey(name);

  const navigation = parseUnimadNavigationFromToolResponse(response, name);
  if (navigation) next.unimadNavigation = navigation;

  if (key === "fetch_recommended_jobs" || key === "search_jobs_for_user") {
    const jobCards = parseJobCardsFromToolResponse(response);
    if (jobCards) next.unimadJobCards = jobCards;
  }

  if (key === "present_linkedin_suggestions") {
    const linkedInSuggestions = parseLinkedInSuggestionsFromToolResponse(response);
    if (linkedInSuggestions) next.unimadLinkedInSuggestions = linkedInSuggestions;
  }

  return next;
}

/**
 * Re-attach Unibot job cards and navigation buttons from persisted ADK tool
 * responses when rebuilding chat history after refresh.
 */
export function enrichAgentMessagesFromToolEvents(messages: AgentMessage[], events: AdkEvent[]): AgentMessage[] {
  if (messages.length === 0 || events.length === 0) return messages;

  const activeEvents = filterActiveAdkEvents(events);
  const pendingByInvocation = new Map<string, ToolEnrichment>();
  const lastModelMessageIdByInvocation = new Map<string, string>();
  let turnIndex = 0;

  for (const event of activeEvents) {
    const content = parseEventContent(event);
    if (content?.role === "user") {
      turnIndex += 1;
    }

    const invocationKey = getEventInvocationId(event) || `turn-${turnIndex}`;

    for (const fr of extractFunctionResponses(event)) {
      const prev = pendingByInvocation.get(invocationKey) ?? {};
      pendingByInvocation.set(invocationKey, mergeToolEnrichment(prev, fr.name, fr.response));
    }

    if (hasModelText(event) && event.id) {
      lastModelMessageIdByInvocation.set(invocationKey, event.id);
    }
  }

  if (pendingByInvocation.size === 0) return messages;

  const enrichmentByMessageId = new Map<string, ToolEnrichment>();
  for (const [invocationKey, enrichment] of pendingByInvocation) {
    const messageId = lastModelMessageIdByInvocation.get(invocationKey);
    if (!messageId) continue;
    if (!enrichment.unimadJobCards && !enrichment.unimadNavigation && !enrichment.unimadLinkedInSuggestions) continue;
    enrichmentByMessageId.set(messageId, enrichment);
  }

  if (enrichmentByMessageId.size === 0) return messages;

  return messages.map(message => {
    const enrichment = enrichmentByMessageId.get(message.id);
    if (!enrichment || message.type !== "ai") return message;
    return {
      ...message,
      ...(enrichment.unimadJobCards ? { unimadJobCards: enrichment.unimadJobCards } : {}),
      ...(enrichment.unimadNavigation ? { unimadNavigation: enrichment.unimadNavigation } : {}),
      ...(enrichment.unimadLinkedInSuggestions ? { unimadLinkedInSuggestions: enrichment.unimadLinkedInSuggestions } : {}),
    };
  });
}
