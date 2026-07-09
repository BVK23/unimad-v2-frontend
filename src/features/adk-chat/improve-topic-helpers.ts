"use client";

import type { Dispatch, SetStateAction } from "react";
import { extractActionLabelFromRefineMessage } from "@/features/application-assets/api/asset-action-message";
import { inferAssetActionMetaFromUserText } from "@/features/application-assets/api/inferAssetActionMetaFromUserText";
import type { ChatMessage } from "@/types";
import { loadSessionHistoryAction } from "./actions";
import { agentMessageToChatMessage } from "./agent-message-to-chat";
import { resolveAdkSessionOptionsForSessionId } from "./resolve-sub-session-adk-app";
import { noteSessionMutatingTool } from "./session-mutating-tool-tracker";
import { getSessionRegistry, setSessionRegistry, type UnibotAdkSessionRow } from "./session-registry";
import { resolveRegistryContentKey } from "./sub-session-content-key";
import { deriveSubSessionDisplayTitle, deriveSubSessionSubtitle } from "./sub-session-titles";
import { listUnibotAdkSessionsAction } from "./unibot-adk-session-actions";

export function topicIdForSubSession(subAdkSessionId: string): string {
  return `topic-sub-${subAdkSessionId}`;
}

function parseTimestamp(ts: Date | string | number): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

/** Restore mutating-tool flags for a sub-session without rebuilding nested messages. */
export async function hydrateSubSessionMutatingTools(userId: string, subAdkSessionId: string): Promise<void> {
  const result = await loadSessionHistoryAction(userId, subAdkSessionId, resolveAdkSessionOptionsForSessionId(subAdkSessionId));
  if (!result.success) return;
  for (const toolName of result.mutatingToolNames ?? []) {
    noteSessionMutatingTool(subAdkSessionId, toolName);
  }
}

/** Load ADK sub-session history into nested topic messages (chronological). */
export async function loadSubSessionChatMessages(userId: string, subAdkSessionId: string): Promise<ChatMessage[]> {
  const result = await loadSessionHistoryAction(userId, subAdkSessionId, resolveAdkSessionOptionsForSessionId(subAdkSessionId));
  if (!result.success || result.messages.length === 0) return [];
  for (const toolName of result.mutatingToolNames ?? []) {
    noteSessionMutatingTool(subAdkSessionId, toolName);
  }
  return result.messages.map(m =>
    agentMessageToChatMessage({
      ...m,
      timestamp: parseTimestamp(m.timestamp as unknown as Date | string | number),
    })
  );
}

function normalizeUserTextForInvocationMatch(text: string): string {
  const { textWithoutMarker } = extractActionLabelFromRefineMessage(text.trim());
  return textWithoutMarker.trim();
}

/** Copy ADK invocation ids onto live topic user bubbles (matched by order or normalized text). */
export function mergeInvocationIdsIntoTopicNestedMessages(localNested: ChatMessage[], loadedFromAdk: ChatMessage[]): ChatMessage[] {
  const adkUsers = loadedFromAdk.filter(m => m.role === "user" && m.invocationId);
  if (adkUsers.length === 0) return localNested;

  const localUsers = localNested.filter(m => m.role === "user");
  const useIndexMatch = localUsers.length === adkUsers.length;
  const usedAdkIndices = new Set<number>();
  let userOrdinal = 0;

  return localNested.map(msg => {
    if (msg.role !== "user") return msg;

    let fromAdk: ChatMessage | undefined;
    if (useIndexMatch) {
      fromAdk = adkUsers[userOrdinal];
    } else {
      const norm = normalizeUserTextForInvocationMatch(msg.text ?? "");
      const matchIndex = adkUsers.findIndex(
        (adk, i) => !usedAdkIndices.has(i) && normalizeUserTextForInvocationMatch(adk.text ?? "") === norm
      );
      if (matchIndex >= 0) {
        usedAdkIndices.add(matchIndex);
        fromAdk = adkUsers[matchIndex];
      } else {
        fromAdk = adkUsers[userOrdinal];
      }
    }
    userOrdinal++;

    if (!fromAdk?.invocationId || msg.invocationId === fromAdk.invocationId) return msg;
    return { ...msg, invocationId: fromAdk.invocationId };
  });
}

function enrichNestedUserActionMeta(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(sub => {
    if (sub.role !== "user" || sub.assetActionMeta || !sub.text?.trim()) return sub;
    const meta = inferAssetActionMetaFromUserText(sub.text);
    return meta ? { ...sub, assetActionMeta: meta } : sub;
  });
}

/** After a live sub-session stream, patch invocation ids so rewind hover works. */
export async function syncTopicUserInvocationIdsFromAdk(
  userId: string,
  subAdkSessionId: string,
  topicId: string,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
): Promise<void> {
  const loaded = await loadSubSessionChatMessages(userId, subAdkSessionId);
  if (loaded.length === 0) return;

  setMessages(prev =>
    prev.map(topic => {
      if (topic.id !== topicId || !topic.isTopic || !topic.messages?.length) return topic;
      const merged = mergeInvocationIdsIntoTopicNestedMessages(topic.messages, loaded);
      return { ...topic, messages: enrichNestedUserActionMeta(merged) };
    })
  );
}

export function findImproveTopic(messages: ChatMessage[], subAdkSessionId: string): ChatMessage | undefined {
  return messages.find(m => m.isTopic && m.subSessionAdkId === subAdkSessionId);
}

/** Find a loaded topic card whose registry sub-session matches the canonical content key. */
export function findTopicByContentKey(messages: ChatMessage[], contentKey: string): ChatMessage | undefined {
  const key = contentKey.trim();
  if (!key) return undefined;
  const registry = getSessionRegistry();
  const match = registry.find(row => {
    if (row.kind !== "sub") return false;
    return resolveRegistryContentKey(row) === key;
  });
  if (!match) return undefined;
  return findImproveTopic(messages, match.adk_session_id);
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

export function topicKindForSub(sub: UnibotAdkSessionRow): ChatMessage["topicKind"] | undefined {
  const feature = (sub.feature ?? "").toLowerCase();
  if (feature === "content_gen" || feature === "linkedin_post" || feature === "linkedin_topic") {
    return "content_gen";
  }
  if (feature === "application_asset" || feature === "coverletter" || feature === "coldemail" || feature === "referral") {
    return "application_asset";
  }
  if (feature === "linkedin" || feature === "resume") {
    return "improve";
  }
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
  const existingTopicIds = new Set(mainMessages.filter(m => m.isTopic).map(m => m.id));

  const topicBlocks: ChatMessage[] = [];
  for (const sub of subs) {
    await hydrateSubSessionMutatingTools(userId, sub.adk_session_id);
    const topicId = topicIdForSubSession(sub.adk_session_id);
    if (existingSubIds.has(sub.adk_session_id) || existingTopicIds.has(topicId)) continue;
    const nested = await loadSubSessionChatMessages(userId, sub.adk_session_id);
    topicBlocks.push({
      id: topicIdForSubSession(sub.adk_session_id),
      role: "model",
      text: "",
      timestamp: sub.created_at ? new Date(sub.created_at) : new Date(),
      isTopic: true,
      topicKind: topicKindForSub(sub),
      topicTitle: deriveSubSessionDisplayTitle(sub),
      topicSubtitle: deriveSubSessionSubtitle(sub),
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
