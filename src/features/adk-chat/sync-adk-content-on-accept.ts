"use client";

import { buildAdkApplicationAssetStateDelta } from "@/features/application-assets/api/adk-mappers";
import { buildAdkContentGenStateDelta } from "@/features/content-lab/api/adk-mappers";
import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta } from "@/features/portfolio/api/mappers";
import { buildAdkLinkedInStateDelta, mapLinkedInSessionProfileToSnapshot } from "@/src/features/linkedin/api/adk-mappers";
import { buildAdkResumeDataMap, buildAdkResumeStateDelta } from "@/src/features/resume/api/mappers";
import type { PortfolioData, ResumeData } from "@/types";
import type {
  AcceptSnapshotPayload,
  ApplicationAssetAcceptPayload,
  ContentGenAcceptPayload,
  LinkedInAcceptPayload,
} from "./accept-snapshots";
import { syncSessionStateAction } from "./actions";

export async function syncAdkContentStateOnAccept(userId: string, sessionId: string, payload: AcceptSnapshotPayload): Promise<void> {
  if (!userId || !sessionId) return;

  if (payload.kind === "application_asset") {
    const p = payload as ApplicationAssetAcceptPayload;
    await syncSessionStateAction(
      userId,
      sessionId,
      buildAdkApplicationAssetStateDelta({
        assetType: p.assetType,
        assetId: p.assetId,
        role: p.role,
        company: p.company,
        jobDescription: p.jobDescription,
        contactName: p.contactName,
        draftPreview: p.content,
      })
    );
    return;
  }

  if (payload.kind === "content_gen") {
    const p = payload as ContentGenAcceptPayload;
    await syncSessionStateAction(
      userId,
      sessionId,
      buildAdkContentGenStateDelta({
        topic: p.topic,
        funnel: p.funnel,
        assetId: p.assetId,
        draftPreview: p.content,
      })
    );
    return;
  }

  if (payload.kind === "resume") {
    const resume = payload.resume;
    const merged = { [resume.id]: resume };
    await syncSessionStateAction(userId, sessionId, {
      ...buildAdkResumeStateDelta(resume),
      resume_data: buildAdkResumeDataMap(merged as Record<string, ResumeData>),
    });
    return;
  }

  if (payload.kind === "portfolio") {
    const portfolio = payload.portfolio;
    const merged = { [portfolio.id]: portfolio };
    await syncSessionStateAction(userId, sessionId, {
      ...buildAdkPortfolioStateDelta(portfolio),
      portfolio_data: buildAdkPortfolioDataMap(merged as Record<string, PortfolioData>),
    });
    return;
  }

  if (payload.kind === "linkedin") {
    const p = payload as LinkedInAcceptPayload;
    const snapshot = mapLinkedInSessionProfileToSnapshot(p.profile, null);
    await syncSessionStateAction(userId, sessionId, buildAdkLinkedInStateDelta(snapshot));
  }
}
