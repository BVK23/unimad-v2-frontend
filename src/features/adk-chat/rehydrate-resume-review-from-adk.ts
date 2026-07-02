"use client";

import { mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { ResumeData } from "@/types";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction } from "./actions";
import { computeAdkReviewFromDiff } from "./adkResumeHighlightDiff";
import { resolveAdkSessionOptionsForSessionId } from "./resolve-sub-session-adk-app";
import { getSubsForMain } from "./session-registry";
import { useAdkResumeReviewStore } from "./stores/useAdkResumeReviewStore";

/**
 * After refresh on the resume editor, pull pending ADK draft from resume sub-sessions
 * and reopen the review card when session data differs from the saved backend copy.
 */
export async function rehydrateResumeReviewFromAdkSessions(params: {
  userId: string;
  mainSessionId: string;
  resumeId: string | null;
  queryClient: QueryClient;
}): Promise<void> {
  const resumeId = params.resumeId?.trim();
  if (!resumeId || !params.userId || !params.mainSessionId) return;

  if (useAdkResumeReviewStore.getState().hasPendingReviewForResume(resumeId)) {
    return;
  }

  const baseline =
    params.queryClient.getQueryData<ResumeData>(resumeByIdQueryKey(resumeId)) ?? useResumeStore.getState().resumeData[resumeId] ?? null;
  if (!baseline) return;

  const subSessions = getSubsForMain(params.mainSessionId).filter(row => {
    if ((row.feature ?? "").trim().toLowerCase() !== "resume") return false;
    const fid = (row.feature_id ?? "").trim();
    return fid === resumeId;
  });

  const sessionIds = [...subSessions.map(row => row.adk_session_id), params.mainSessionId];

  for (const sessionId of sessionIds) {
    const options = resolveAdkSessionOptionsForSessionId(sessionId);
    const pullResult = await pullSessionStateAction(params.userId, sessionId, options);
    if (!pullResult.success || !pullResult.state?.resume_data) continue;

    const nextResumes = mapAdkResumeDataMapToFrontend(pullResult.state.resume_data);
    const sourceResume = nextResumes[resumeId];
    if (!sourceResume) continue;

    const { highlights, bannerTitle } = computeAdkReviewFromDiff(baseline, sourceResume);
    if (Object.keys(highlights).length > 0) {
      useAdkResumeReviewStore.getState().beginReview({
        resumeId,
        baselineResume: baseline,
        highlights,
        bannerTitle,
        assistantMessageId: null,
      });
      useResumeStore.setState(state => ({
        resumeData: { ...state.resumeData, ...nextResumes },
      }));
      params.queryClient.setQueryData(resumeByIdQueryKey(resumeId), sourceResume);
      return;
    }

    useResumeStore.setState(state => ({
      resumeData: { ...state.resumeData, ...nextResumes },
    }));
    params.queryClient.setQueryData(resumeByIdQueryKey(resumeId), sourceResume);
  }
}
