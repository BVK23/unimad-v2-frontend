/**
 * Shared types for SSE streaming utilities
 * These types are used across parser, processor, and connection utilities
 */
import type { AgentMessage, ProcessedEvent } from "../types";

/**
 * Parsed SSE data structure returned by the parser
 */
export interface ParsedSSEData {
  messageId?: string; // Message ID from backend
  textParts: string[];
  thoughtParts: string[];
  agent: string;
  /** ADK progressive stream marker — tool/author signals may arrive on partial events. */
  partial?: boolean;
  /** Synthetic progress label injected by ADK middleware before real events arrive. */
  streamActivityHint?: string;
  /** ADK sets this on the user-role event after a handoff tool completes. */
  transferToAgent?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    id: string;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
    id: string;
  };
}

/**
 * Raw SSE parsed JSON structure from the backend
 */
export interface RawSSEData {
  id?: string; // Message ID from backend
  /** ADK /run_sse error object: `{"error":"..."}` */
  error?: string;
  errorCode?: string;
  errorMessage?: string;
  partial?: boolean;
  /** Injected by Unimad ADK /run_sse middleware (not native ADK). */
  unimadStreamActivity?: string;
  turnComplete?: boolean;
  content?:
    | string
    | {
        parts?: Array<{
          text?: string;
          thought?: boolean;
          functionCall?: {
            name: string;
            args: Record<string, unknown>;
            id: string;
          };
          functionResponse?: {
            name: string;
            response: Record<string, unknown>;
            id: string;
          };
        }>;
      };
  author?: string;
  actions?: {
    transferToAgent?: string;
    transfer_to_agent?: string;
    stateDelta?: Record<string, unknown>;
  };
}

/**
 * SSE connection state
 */
export type SSEConnectionState = "idle" | "connecting" | "connected" | "error" | "closed";

/**
 * SSE event types for processing
 */
export type SSEEventType = "data" | "comment" | "empty" | "unknown";

/**
 * Processed SSE line structure
 */
export interface ProcessedSSELine {
  type: SSEEventType;
  content: string;
}

/**
 * Stream processing callbacks interface
 */
export interface StreamProcessingCallbacks {
  onMessageUpdate: (message: AgentMessage) => void;
  onEventUpdate: (messageId: string, event: ProcessedEvent) => void;
  onWebsiteCountUpdate: (count: number) => void;
  /** After a tool mutates ADK session state, frontend can refresh Zustand from GET session. */
  onMutatingToolResponse?: (toolName: string, aiMessageId: string) => void;
  /**
   * A tool created (or resolved duplicate of) a resume/portfolio/etc. asset in Django.
   * Frontend should invalidate the relevant React Query list so the landing page updates
   * without a full page reload when the user is already on that feature.
   */
  onAssetCreated?: (payload: { kind: "resume" | "portfolio" | "studio" | "linkedin"; toolName: string }) => void;
  /** `suggest_unimad_navigation` completed — show Go to page button on the assistant message. */
  onNavigationSuggestion?: (aiMessageId: string, navigation: { path: string; label: string }) => void;
  /** Job board tool completed — show compact job cards on the assistant message. */
  onJobCardsSuggestion?: (aiMessageId: string, payload: import("../parse-unimad-job-cards").UnimadJobCardsPayload) => void;
  /** LinkedIn sub-thread tool completed — show copy-ready suggestion cards. */
  onLinkedInSuggestions?: (
    aiMessageId: string,
    payload: import("../parse-unimad-linkedin-suggestions").UnimadLinkedInSuggestionsPayload
  ) => void;
  /** Short UX line while streaming (agent handoff, tool call, etc.). */
  onStreamActivityHint?: (hint: { label: string }) => void;
}

/**
 * API payload structure for streaming requests
 */
export interface StreamingAPIPayload {
  message: string;
  userId: string;
  sessionId: string;
  adkAppName?: string;
}

/**
 * Connection manager options
 */
export interface StreamTimingCallbacks {
  onFetchStart?: () => void;
  /** Response headers received (TTFB from browser to /api/run_sse). */
  onFetchResponse?: (response: Response) => void;
  /** First non-empty SSE body chunk from the backend stream. */
  onFirstSseChunk?: () => void;
}

export interface ConnectionManagerOptions {
  retryFn?: <T>(fn: () => Promise<T>) => Promise<T>;
  endpoint?: string;
  streamTiming?: StreamTimingCallbacks;
}
