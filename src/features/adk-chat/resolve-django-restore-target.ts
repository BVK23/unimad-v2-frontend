"use client";

import type { ChatMessage } from "@/types";
import type { AcceptSnapshot, AcceptSnapshotPayload, AcceptSnapshotsMap } from "./accept-snapshots";
import type { ContentScope } from "./content-scope";
import type { ReviewDecisionsMap } from "./review-decisions";
import { snapshotMatchesScopeRelaxed } from "./thread-revert-eligibility";

export type DjangoRestoreTarget = {
  snapshot: AcceptSnapshot;
  payload: AcceptSnapshotPayload;
};

function collectAssistantIdsInOrder(messages: ChatMessage[]): string[] {
  const ids: string[] = [];
  for (const message of messages) {
    if (message.role === "model" && message.id && message.text?.trim() && !message.isError) {
      ids.push(message.id);
    }
  }
  return ids;
}

function collectAssistantIdsInOrderFromThread(messages: ChatMessage[], topicId?: string): string[] {
  if (topicId) {
    const topic = messages.find(message => message.id === topicId);
    return collectAssistantIdsInOrder(topic?.messages ?? []);
  }
  return collectAssistantIdsInOrder(messages.filter(message => !message.isTopic));
}

function snapshotMatchesScope(snapshot: AcceptSnapshot, targetScope: ContentScope): boolean {
  return snapshotMatchesScopeRelaxed(snapshot, targetScope);
}

function pickPayload(snapshot: AcceptSnapshot, usePost: boolean): AcceptSnapshotPayload {
  return usePost ? snapshot.postAcceptPayload : snapshot.preAcceptPayload;
}

export function resolveDjangoRestoreTarget(params: {
  threadMessagesBeforeRewind: ChatMessage[];
  remainingMessages: ChatMessage[];
  removedAssistantIds: Set<string>;
  acceptSnapshots: AcceptSnapshotsMap;
  reviewDecisions: ReviewDecisionsMap;
  targetScope: ContentScope;
  topicId?: string;
}): DjangoRestoreTarget | null {
  const beforeOrder = collectAssistantIdsInOrderFromThread(params.threadMessagesBeforeRewind, params.topicId);
  const remainingOrder = collectAssistantIdsInOrder(params.remainingMessages);
  const removedOrdered = beforeOrder.filter(id => params.removedAssistantIds.has(id));

  for (let index = remainingOrder.length - 1; index >= 0; index -= 1) {
    const assistantId = remainingOrder[index]!;
    if (params.reviewDecisions[assistantId] !== "accepted") continue;
    const snapshot = params.acceptSnapshots[assistantId];
    if (!snapshot || !snapshotMatchesScope(snapshot, params.targetScope)) continue;
    return { snapshot, payload: pickPayload(snapshot, true) };
  }

  for (const assistantId of removedOrdered) {
    if (params.reviewDecisions[assistantId] !== "accepted") continue;
    const snapshot = params.acceptSnapshots[assistantId];
    if (!snapshot || !snapshotMatchesScope(snapshot, params.targetScope)) continue;
    return { snapshot, payload: pickPayload(snapshot, false) };
  }

  return null;
}
