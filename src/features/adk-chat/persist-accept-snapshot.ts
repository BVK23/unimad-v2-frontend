"use client";

import { buildAcceptSnapshotStateDelta, recordAcceptSnapshot, type AcceptSnapshot } from "./accept-snapshots";
import { syncSessionStateAction } from "./actions";

export async function persistAcceptSnapshotForSession(userId: string, sessionId: string, snapshot: AcceptSnapshot): Promise<void> {
  if (!userId || !sessionId || !snapshot.assistantMessageId.trim()) {
    return;
  }
  const next = recordAcceptSnapshot(userId, sessionId, snapshot);
  const result = await syncSessionStateAction(userId, sessionId, buildAcceptSnapshotStateDelta(next));
  if (!result.success) {
    /* localStorage already updated as fallback */
  }
}
