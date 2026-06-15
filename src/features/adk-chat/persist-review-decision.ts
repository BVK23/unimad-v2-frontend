"use client";

import { syncSessionStateAction } from "./actions";
import { persistReviewDecision, type ReviewDecision } from "./review-decisions";

export async function persistReviewDecisionForSession(
  userId: string,
  sessionId: string,
  assistantMessageId: string | null | undefined,
  decision: ReviewDecision
): Promise<void> {
  if (!userId || !sessionId) {
    return;
  }
  await persistReviewDecision(userId, sessionId, assistantMessageId, decision, async (uid, sid, delta) => {
    const result = await syncSessionStateAction(uid, sid, delta);
    return { success: result.success };
  });
}
