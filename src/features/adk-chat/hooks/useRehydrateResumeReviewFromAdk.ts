"use client";

import { useEffect } from "react";
import { useAdkChatContext } from "@/components/chat/AdkChatProvider";
import { rehydrateResumeReviewFromAdkSessions } from "@/src/features/adk-chat/rehydrate-resume-review-from-adk";
import { useQueryClient } from "@tanstack/react-query";

/** Re-open resume Accept/Discard after refresh once backend baseline is available. */
export function useRehydrateResumeReviewFromAdk(resumeId: string | null | undefined, enabled = true): void {
  const { userId, sessionId } = useAdkChatContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = resumeId?.trim();
    if (!enabled || !id || !userId || !sessionId) return;
    void rehydrateResumeReviewFromAdkSessions({
      userId,
      mainSessionId: sessionId,
      resumeId: id,
      queryClient,
    });
  }, [enabled, resumeId, userId, sessionId, queryClient]);
}
