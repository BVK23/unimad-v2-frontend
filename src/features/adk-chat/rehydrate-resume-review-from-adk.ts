"use client";

import { mapAdkResumeDataMapToFrontend, buildAdkResumeDataMap, buildAdkResumeStateDelta } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { ResumeData } from "@/types";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction, syncSessionStateAction } from "./actions";
import { computeAdkReviewFromDiff } from "./adkResumeHighlightDiff";
import { resolveAdkSessionOptionsForSessionId } from "./resolve-sub-session-adk-app";
import { getSubsForMain } from "./session-registry";
import { useAdkResumeReviewStore } from "./stores/useAdkResumeReviewStore";

/**
 * TODO(smart-re-show): Optionally re-offer Accept/Discard after refresh when ADK draft is
 * fresh, user is on the matching asset, and a live diff still applies. Defer until user feedback.
 */

/**
 * After refresh on the resume editor:
 * - Never create Accept/Discard cards (refresh without accept = edit is lost)
 * - Clear any stale review cards
 * - Align stale ADK session drafts to the saved backend copy
 * - Do not overwrite the in-memory editor with ADK session data
 */
export async function reconcileResumeAdkSessionsOnRefresh(params: {
  userId: string;
  mainSessionId: string;
  resumeId: string | null;
  queryClient: QueryClient;
}): Promise<void> {
  const resumeId = params.resumeId?.trim();
  if (!resumeId || !params.userId || !params.mainSessionId) return;

  useAdkResumeReviewStore.getState().dismissReviewsForResume(resumeId);

  const baseline =
    params.queryClient.getQueryData<ResumeData>(resumeByIdQueryKey(resumeId)) ?? useResumeStore.getState().resumeData[resumeId] ?? null;
  if (!baseline) return;

  const subSessions = getSubsForMain(params.mainSessionId).filter(row => {
    if ((row.feature ?? "").trim().toLowerCase() !== "resume") return false;
    return (row.feature_id ?? "").trim() === resumeId;
  });

  const sessionIds = [...subSessions.map(row => row.adk_session_id), params.mainSessionId];

  for (const sessionId of sessionIds) {
    const options = resolveAdkSessionOptionsForSessionId(sessionId);
    const pullResult = await pullSessionStateAction(params.userId, sessionId, options);
    if (!pullResult.success || !pullResult.state?.resume_data) continue;

    const nextResumes = mapAdkResumeDataMapToFrontend(pullResult.state.resume_data);
    const sourceResume = nextResumes[resumeId];
    if (!sourceResume) continue;

    const { highlights } = computeAdkReviewFromDiff(baseline, sourceResume);
    if (Object.keys(highlights).length === 0) continue;

    const merged = { [resumeId]: baseline };
    await syncSessionStateAction(params.userId, sessionId, {
      ...buildAdkResumeStateDelta(baseline),
      resume_data: buildAdkResumeDataMap(merged as Record<string, ResumeData>),
    });
  }
}

/** @deprecated Use reconcileResumeAdkSessionsOnRefresh */
export const rehydrateResumeReviewFromAdkSessions = reconcileResumeAdkSessionsOnRefresh;
