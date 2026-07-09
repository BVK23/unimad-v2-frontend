"use client";

import type { ChatMessage } from "@/types";
import { getAcceptSnapshotsCache } from "./accept-snapshots";
import type { AcceptSnapshot } from "./accept-snapshots";
import type { ContentScope, ScopeMatch } from "./content-scope";
import { getThreadMessages } from "./is-first-thread-user-message";
import { getReviewDecisionsCache } from "./review-decisions";
import { sessionHasMutatingToolChanges } from "./session-mutating-tool-tracker";
import { getRegistryRow } from "./session-registry";

export function snapshotMatchesScopeRelaxed(snapshot: AcceptSnapshot, targetScope: ContentScope): boolean {
  if (snapshot.domain !== targetScope.domain) return false;
  if (snapshot.contentKey === targetScope.contentKey) return true;
  return targetScope.contentKey.startsWith(`${snapshot.contentKey}:`) || snapshot.contentKey.startsWith(`${targetScope.contentKey}:`);
}

function collectThreadAssistantIds(messages: ChatMessage[], topicId?: string): string[] {
  return getThreadMessages(messages, topicId)
    .filter(message => message.role === "model" && message.id && message.text?.trim() && !message.isError)
    .map(message => message.id);
}

export function threadHasAcceptedSnapshotsForScope(params: {
  userId: string;
  mainSessionId: string;
  messages: ChatMessage[];
  topicId?: string;
  targetScope: ContentScope;
}): boolean {
  const assistantIds = new Set(collectThreadAssistantIds(params.messages, params.topicId));
  if (assistantIds.size === 0) return false;

  const snapshots = getAcceptSnapshotsCache(params.userId, params.mainSessionId);
  const decisions = getReviewDecisionsCache(params.userId, params.mainSessionId);

  for (const assistantId of assistantIds) {
    if (decisions[assistantId] !== "accepted") continue;
    const snapshot = snapshots[assistantId];
    if (snapshot && snapshotMatchesScopeRelaxed(snapshot, params.targetScope)) {
      return true;
    }
  }

  return false;
}

export function canOfferRevertOnThreadDelete(params: {
  scopeMatch: ScopeMatch;
  targetSessionId: string;
  messageScope?: ContentScope;
  userId: string;
  mainSessionId: string;
  messages: ChatMessage[];
  topicId?: string;
}): boolean {
  if (params.scopeMatch === "cross_domain" || !params.messageScope?.contentKey) {
    return false;
  }

  // Session-level: Unibot used a mutating tool in this thread (hydrated from ADK history after refresh).
  if (sessionHasMutatingToolChanges(params.targetSessionId)) {
    return true;
  }

  // Snapshot-level: user accepted a review whose pre-accept state we can restore.
  return threadHasAcceptedSnapshotsForScope({
    userId: params.userId,
    mainSessionId: params.mainSessionId,
    messages: params.messages,
    topicId: params.topicId,
    targetScope: params.messageScope,
  });
}

export function scopeAllowsEditorRevert(scopeMatch: ScopeMatch | undefined): boolean {
  return scopeMatch !== "cross_domain";
}

export function resolveMainSessionIdForRevert(targetSessionId: string, fallbackSessionId: string): string {
  const row = getRegistryRow(targetSessionId);
  return row?.parent_adk_session_id?.trim() || fallbackSessionId;
}
