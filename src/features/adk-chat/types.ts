/**
 * ADK chat feature types — agent lane message shape and session/event types.
 */

export interface AgentMessage {
  type: "human" | "ai";
  content: string;
  id: string;
  timestamp: Date;
  agent?: string;
  timelineActivities?: TimelineActivity[];
}

export interface ProcessedEvent {
  title: string;
  data: unknown;
}

export interface AdkEvent {
  id: string;
  author: string;
  /** API may return JSON string or structured content */
  content?: AdkContent | string;
  actions?: AdkEventActions;
  invocationId: string;
  timestamp: number;
  partial?: boolean;
  turnComplete?: boolean;
  errorCode?: string;
  errorMessage?: string;
  interrupted?: boolean;
  branch?: string;
  groundingMetadata?: Record<string, unknown>;
}

export interface AdkContent {
  parts: AdkPart[];
  role: "user" | "model";
}

export interface AdkPart {
  text?: string;
  thought?: boolean;
  function_call?: {
    name: string;
    args: Record<string, unknown>;
    id: string;
  };
  function_response?: {
    name: string;
    response: Record<string, unknown>;
    id: string;
  };
  video_metadata?: unknown;
  inline_data?: unknown;
  file_data?: unknown;
  thought_signature?: unknown;
  code_execution_result?: unknown;
  executable_code?: unknown;
}

export interface AdkEventActions {
  stateDelta?: Record<string, unknown>;
}

export interface AdkSession {
  id?: string;
  app_name: string;
  user_id: string;
  state: Record<string, unknown> | null;
  last_update_time: string | null;
  events?: AdkEvent[];
  name?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ListSessionsResponse {
  sessions: AdkSession[];
  sessionIds: string[];
}

export interface ListEventsResponse {
  events: AdkEvent[];
  nextPageToken?: string;
}

export interface AdkSessionWithEvents extends AdkSession {
  events: AdkEvent[];
}

export interface TimelineActivity {
  id: string;
  type: string;
  agent: string;
  title: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConversionResult {
  messages: AgentMessage[];
  timelineActivities: TimelineActivity[];
}
