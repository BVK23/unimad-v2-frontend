"use client";

import { mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction } from "./actions";

/**
 * After rewind, optionally align Zustand + React Query with ADK session state
 * (resume_data / portfolio_data maps).
 */
export async function applyAdkSessionStateToStores(
  userId: string,
  sessionId: string,
  pathname: string,
  queryClient: QueryClient
): Promise<{ applied: boolean; error?: string }> {
  const pullResult = await pullSessionStateAction(userId, sessionId);
  if (!pullResult.success || !pullResult.state) {
    return {
      applied: false,
      error: pullResult.error ?? "Could not read ADK session state.",
    };
  }

  const state = pullResult.state;
  let applied = false;

  if (pathname.startsWith("/uniboard/resume") && state.resume_data) {
    const nextResumes = mapAdkResumeDataMapToFrontend(state.resume_data);
    const currentResumeIdRaw = state.current_resume;
    const currentResumeId =
      typeof currentResumeIdRaw === "string" && currentResumeIdRaw.trim().length > 0 ? currentResumeIdRaw.trim() : null;
    useResumeStore.setState({ resumeData: nextResumes });
    if (currentResumeId && nextResumes[currentResumeId]) {
      queryClient.setQueryData(resumeByIdQueryKey(currentResumeId), nextResumes[currentResumeId]);
    }
    applied = true;
  }

  if (pathname.startsWith("/uniboard/portfolio") && state.portfolio_data) {
    const nextPortfolios = mapAdkPortfolioDataMapToFrontend(state.portfolio_data);
    const currentPortfolioIdRaw = state.current_portfolio;
    const currentPortfolioId =
      typeof currentPortfolioIdRaw === "string" && currentPortfolioIdRaw.trim().length > 0 ? currentPortfolioIdRaw.trim() : null;
    usePortfolioStore.setState({ portfolioData: nextPortfolios });
    if (currentPortfolioId && nextPortfolios[currentPortfolioId]) {
      queryClient.setQueryData(portfolioQueryKey, nextPortfolios[currentPortfolioId]);
    }
    applied = true;
  }

  return { applied };
}
