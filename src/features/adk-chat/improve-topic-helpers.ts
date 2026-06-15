"use client";

import type { ChatMessage } from "@/types";
import { loadSessionHistoryAction } from "./actions";
import { getSessionRegistry, setSessionRegistry, type UnibotAdkSessionRow } from "./session-registry";
import type { AgentMessage } from "./types";
import { listUnibotAdkSessionsAction } from "./unibot-adk-session-actions";

export function topicIdForSubSession(subAdkSessionId: string): string {
  return `topic-sub-${subAdkSessionId}`;
}

function parseTimestamp(ts: Date | string | number): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

function agentToChat(m: AgentMessage): ChatMessage {
  return {
    id: m.id,
    role: m.type === "human" ? "user" : "model",
    text: m.content,
    timestamp: parseTimestamp(m.timestamp as unknown as Date | string | number),
    ...(m.invocationId ? { invocationId: m.invocationId } : {}),
  };
}

/** Load ADK sub-session history into nested topic messages (chronological). */
export async function loadSubSessionChatMessages(userId: string, subAdkSessionId: string): Promise<ChatMessage[]> {
  const result = await loadSessionHistoryAction(userId, subAdkSessionId);
  if (!result.success || result.messages.length === 0) return [];
  return result.messages.map(m =>
    agentToChat({
      ...m,
      timestamp: parseTimestamp(m.timestamp as unknown as Date | string | number),
    })
  );
}

export function findImproveTopic(messages: ChatMessage[], subAdkSessionId: string): ChatMessage | undefined {
  return messages.find(m => m.isTopic && m.subSessionAdkId === subAdkSessionId);
}

function subsForMain(mainSessionId: string, registry = getSessionRegistry()): UnibotAdkSessionRow[] {
  return registry
    .filter(r => r.kind === "sub" && r.parent_adk_session_id === mainSessionId)
    .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
}

/** Keep welcome first; sort everything else by timestamp (main + topic blocks). */
export function sortMainThreadChronologically(messages: ChatMessage[]): ChatMessage[] {
  const welcome = messages.find(m => m.id === "welcome");
  const rest = messages.filter(m => m.id !== "welcome");
  rest.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return welcome ? [welcome, ...rest] : rest;
}

function topicKindForSub(sub: UnibotAdkSessionRow): ChatMessage["topicKind"] | undefined {
  if (sub.feature === "content_gen") return "content_gen";
  if (sub.feature === "application_asset") return "application_asset";
  return undefined;
}

/**
 * After loading a main ADK session, attach each registry sub-session as a collapsed
 * improve / content_gen / application_asset topic (with nested history). Fresh load:
 * topics use Django `created_at` for ordering among themselves; live wand clicks
 * append with `new Date()` so they appear after current main messages.
 */
export async function mergeSubSessionsIntoMainMessages(
  userId: string,
  mainSessionId: string,
  mainMessages: ChatMessage[]
): Promise<ChatMessage[]> {
  const list = await listUnibotAdkSessionsAction();
  if (list.success) {
    setSessionRegistry(list.sessions);
  }

  const subs = subsForMain(mainSessionId);
  if (subs.length === 0) return mainMessages;

  const existingSubIds = new Set(mainMessages.filter(m => m.isTopic && m.subSessionAdkId).map(m => m.subSessionAdkId as string));

  const topicBlocks: ChatMessage[] = [];
  for (const sub of subs) {
    if (existingSubIds.has(sub.adk_session_id)) continue;
    const nested = await loadSubSessionChatMessages(userId, sub.adk_session_id);
    topicBlocks.push({
      id: topicIdForSubSession(sub.adk_session_id),
      role: "model",
      text: "",
      timestamp: sub.created_at ? new Date(sub.created_at) : new Date(),
      isTopic: true,
      topicKind: topicKindForSub(sub),
      topicTitle: sub.title,
      isExpanded: false,
      subSessionAdkId: sub.adk_session_id,
      messages: nested,
    });
  }

  if (topicBlocks.length === 0) return mainMessages;

  const withoutStaleTopics = mainMessages.filter(
    m => !(m.isTopic && m.subSessionAdkId && !subs.some(s => s.adk_session_id === m.subSessionAdkId))
  );

  return sortMainThreadChronologically([...withoutStaleTopics, ...topicBlocks]);
}

/** Insert a new topic block in chronological position (live improve). */
export function insertTopicInMainThread(messages: ChatMessage[], topic: ChatMessage): ChatMessage[] {
  return sortMainThreadChronologically([...messages.filter(m => m.id !== topic.id), topic]);
}
