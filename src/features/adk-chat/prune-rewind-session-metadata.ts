"use client";

import { buildAcceptSnapshotStateDelta, pruneAcceptSnapshotsByAssistantIds, type AcceptSnapshotsMap } from "./accept-snapshots";
import { syncSessionStateAction } from "./actions";
import { buildReviewDecisionStateDelta, pruneReviewDecisionsByAssistantIds, type ReviewDecisionsMap } from "./review-decisions";

export async function pruneRewindSessionMetadata(
  userId: string,
  mainSessionId: string,
  removedAssistantIds: Iterable<string>
): Promise<{ snapshots: AcceptSnapshotsMap; decisions: ReviewDecisionsMap }> {
  const snapshots = pruneAcceptSnapshotsByAssistantIds(userId, mainSessionId, removedAssistantIds);
  const decisions = pruneReviewDecisionsByAssistantIds(userId, mainSessionId, removedAssistantIds);
  await syncSessionStateAction(userId, mainSessionId, {
    ...buildAcceptSnapshotStateDelta(snapshots),
    ...buildReviewDecisionStateDelta(decisions),
  });
  return { snapshots, decisions };
}
