"use client";

import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta } from "@/features/portfolio/api/mappers";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildAdkResumeDataMap, buildAdkResumeStateDelta } from "@/src/features/resume/api/mappers";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { PortfolioData, ResumeData } from "@/types";
import type { AcceptSnapshotPayload } from "./accept-snapshots";
import { syncSessionStateAction } from "./actions";
import { getSubsForMain } from "./session-registry";
import { syncAdkContentStateOnAccept } from "./sync-adk-content-on-accept";

function resumeSubSessions(mainSessionId: string, resumeId: string) {
  const id = resumeId.trim();
  return getSubsForMain(mainSessionId).filter(
    row => (row.feature ?? "").trim().toLowerCase() === "resume" && (row.feature_id ?? "").trim() === id
  );
}

function portfolioSubSessions(mainSessionId: string, portfolioId: string) {
  const id = portfolioId.trim();
  return getSubsForMain(mainSessionId).filter(
    row => (row.feature ?? "").trim().toLowerCase() === "portfolio" && (row.feature_id ?? "").trim() === id
  );
}

/** Push accepted resume snapshot to main + matching resume sub-sessions. */
export async function syncAcceptedResumeToAllSessions(userId: string, mainSessionId: string, resume: ResumeData): Promise<void> {
  if (!userId?.trim() || !mainSessionId?.trim()) return;

  const merged = { ...useResumeStore.getState().resumeData, [resume.id]: resume };
  const payload: AcceptSnapshotPayload = { kind: "resume", resume };
  await syncAdkContentStateOnAccept(userId, mainSessionId, payload);

  const delta = {
    ...buildAdkResumeStateDelta(resume),
    resume_data: buildAdkResumeDataMap(merged),
  };

  for (const sub of resumeSubSessions(mainSessionId, resume.id)) {
    await syncSessionStateAction(userId, sub.adk_session_id, delta);
  }
}

/** Restore baseline resume in main + matching resume sub-sessions after Discard. */
export async function syncDiscardedResumeToAllSessions(userId: string, mainSessionId: string, baseline: ResumeData): Promise<void> {
  if (!userId?.trim() || !mainSessionId?.trim()) return;

  const merged = { ...useResumeStore.getState().resumeData, [baseline.id]: baseline };
  const delta = {
    ...buildAdkResumeStateDelta(baseline),
    resume_data: buildAdkResumeDataMap(merged),
  };

  await syncSessionStateAction(userId, mainSessionId, delta);
  for (const sub of resumeSubSessions(mainSessionId, baseline.id)) {
    await syncSessionStateAction(userId, sub.adk_session_id, delta);
  }
}

/** Push accepted portfolio snapshot to main + matching portfolio sub-sessions. */
export async function syncAcceptedPortfolioToAllSessions(userId: string, mainSessionId: string, portfolio: PortfolioData): Promise<void> {
  if (!userId?.trim() || !mainSessionId?.trim()) return;

  const merged = { ...usePortfolioStore.getState().portfolioData, [portfolio.id]: portfolio };
  const payload: AcceptSnapshotPayload = { kind: "portfolio", portfolio };
  await syncAdkContentStateOnAccept(userId, mainSessionId, payload);

  const warmResume = buildAdkResumeDataMap(useResumeStore.getState().resumeData);
  const delta = {
    ...buildAdkPortfolioStateDelta(portfolio),
    portfolio_data: buildAdkPortfolioDataMap(merged),
    resume_data: warmResume,
    current_resume: null,
  };

  for (const sub of portfolioSubSessions(mainSessionId, portfolio.id)) {
    await syncSessionStateAction(userId, sub.adk_session_id, delta);
  }
}

/** Restore baseline portfolio in main + matching portfolio sub-sessions after Discard. */
export async function syncDiscardedPortfolioToAllSessions(userId: string, mainSessionId: string, baseline: PortfolioData): Promise<void> {
  if (!userId?.trim() || !mainSessionId?.trim()) return;

  const merged = { ...usePortfolioStore.getState().portfolioData, [baseline.id]: baseline };
  const warmResume = buildAdkResumeDataMap(useResumeStore.getState().resumeData);
  const delta = {
    ...buildAdkPortfolioStateDelta(baseline),
    portfolio_data: buildAdkPortfolioDataMap(merged),
    resume_data: warmResume,
    current_resume: null,
  };

  await syncSessionStateAction(userId, mainSessionId, delta);
  for (const sub of portfolioSubSessions(mainSessionId, baseline.id)) {
    await syncSessionStateAction(userId, sub.adk_session_id, delta);
  }
}
