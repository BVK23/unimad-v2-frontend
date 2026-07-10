"use client";

import { useEffect } from "react";
import { useAdkChatContext } from "@/components/chat/AdkChatProvider";
import { reconcileResumeAdkSessionsOnRefresh } from "@/src/features/adk-chat/rehydrate-resume-review-from-adk";
import { useQueryClient } from "@tanstack/react-query";

/** Align stale ADK resume sessions to backend after refresh (no Accept/Discard cards). */
export function useRehydrateResumeReviewFromAdk(resumeId: string | null | undefined, enabled = true): void {
  const { userId, sessionId } = useAdkChatContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = resumeId?.trim();
    if (!enabled || !id || !userId || !sessionId) return;
    void reconcileResumeAdkSessionsOnRefresh({
      userId,
      mainSessionId: sessionId,
      resumeId: id,
      queryClient,
    });
  }, [enabled, resumeId, userId, sessionId, queryClient]);
}
