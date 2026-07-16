"use client";

import { APPLICATION_ASSET_EVENTS } from "@/features/application-assets/api/application-asset-events";
import { acceptApplicationAsset } from "@/features/application-assets/server-actions/application-asset-actions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { updateContentGenAsset } from "@/features/content-lab/server-actions/content-lab-actions";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { mapFrontendPortfolioToBackend } from "@/features/portfolio/api/mappers";
import { setLivePortfolioQueryData } from "@/features/portfolio/hooks/usePortfolio";
import { updatePortfolioContent } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildAdkLinkedInStateDelta } from "@/src/features/linkedin/api/adk-mappers";
import type { LinkedInSessionProfile } from "@/src/features/linkedin/api/adk-mappers";
import { linkedinAnalysisQueryKey } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import { updateLinkedInProfileContent } from "@/src/features/linkedin/server-actions/linkedin-analyzer-actions";
import { mapFrontendResumeToBackend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { updateResumeContent } from "@/src/features/resume/server-actions/resume-actions";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { PortfolioData, ResumeData } from "@/types";
import type { QueryClient } from "@tanstack/react-query";
import type { AcceptSnapshotPayload } from "./accept-snapshots";
import type { DjangoRestoreTarget } from "./resolve-django-restore-target";
import { syncAdkContentStateOnAccept } from "./sync-adk-content-on-accept";

export async function revertDjangoContentAfterRewind(params: {
  target: DjangoRestoreTarget;
  userId: string;
  mainSessionId: string;
  queryClient: QueryClient;
}): Promise<boolean> {
  const { target, userId, mainSessionId, queryClient } = params;
  const payload = target.payload;

  if (payload.kind === "application_asset") {
    const content = payload.content ?? "";
    const assetId = payload.assetId?.trim();
    if (assetId) {
      await acceptApplicationAsset(payload.assetType, assetId, content);
    }
    useApplicationAssetStudioStore.getState().syncFromStudio({
      assetType: payload.assetType,
      assetId: assetId ?? null,
      role: payload.role ?? "",
      company: payload.company ?? "",
      jobDescription: payload.jobDescription ?? "",
      contactName: payload.contactName ?? "",
      draftPreview: content,
      acceptedContent: content,
    });
    window.dispatchEvent(
      new CustomEvent(APPLICATION_ASSET_EVENTS.draftReady, {
        detail: {
          assetId,
          assetType: payload.assetType,
          draft: content,
          role: payload.role,
          company: payload.company,
          jobDescription: payload.jobDescription,
          contactName: payload.contactName,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent(APPLICATION_ASSET_EVENTS.draftPreview, {
        detail: {
          draft: content,
          assetType: payload.assetType,
          role: payload.role,
          company: payload.company,
          jobDescription: payload.jobDescription,
          contactName: payload.contactName,
          assetId,
        },
      })
    );
    await syncAdkContentStateOnAccept(userId, mainSessionId, payload);
    return true;
  }

  if (payload.kind === "content_gen") {
    const content = payload.content ?? "";
    const assetId = payload.assetId?.trim();
    if (assetId) {
      const saveResult = await updateContentGenAsset({ id: assetId, content });
      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }
    }
    useContentGenStudioStore.getState().syncFromStudio({
      topic: payload.topic,
      funnel: payload.funnel,
      assetId: assetId ?? null,
      draftPreview: content,
    });
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.draftReady, {
        detail: {
          assetId,
          topic: payload.topic,
          funnel: payload.funnel,
          draft: content,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.draftPreview, {
        detail: {
          draft: content,
          topic: payload.topic,
          funnel: payload.funnel,
          assetId,
          isTopicChange: false,
        },
      })
    );
    await syncAdkContentStateOnAccept(userId, mainSessionId, payload);
    return true;
  }

  if (payload.kind === "resume") {
    const resume = payload.resume;
    const backendPayload = mapFrontendResumeToBackend(resume);
    await updateResumeContent(resume.id, backendPayload);
    const merged = { ...useResumeStore.getState().resumeData, [resume.id]: resume };
    useResumeStore.setState({ resumeData: merged });
    queryClient.setQueryData(resumeByIdQueryKey(resume.id), resume);
    await syncAdkContentStateOnAccept(userId, mainSessionId, payload);
    window.dispatchEvent(
      new CustomEvent("resume-adk-discard", {
        detail: { resumeId: resume.id, baselineJson: JSON.stringify(resume) },
      })
    );
    return true;
  }

  if (payload.kind === "portfolio") {
    const portfolio = payload.portfolio;
    await updatePortfolioContent(mapFrontendPortfolioToBackend(portfolio));
    const merged = { ...usePortfolioStore.getState().portfolioData, [portfolio.id]: portfolio };
    usePortfolioStore.setState({ portfolioData: merged });
    setLivePortfolioQueryData(queryClient, portfolio);
    await syncAdkContentStateOnAccept(userId, mainSessionId, payload);
    window.dispatchEvent(
      new CustomEvent("portfolio-adk-discard", {
        detail: { portfolioId: portfolio.id, baselineJson: JSON.stringify(portfolio) },
      })
    );
    return true;
  }

  if (payload.kind === "linkedin") {
    const profile = payload.profile;
    const persistFields: {
      headline?: string;
      about?: string;
      experience?: unknown[];
      skills?: unknown[];
    } = {};
    if (typeof profile.headline === "string") persistFields.headline = profile.headline;
    if (typeof profile.about === "string") persistFields.about = profile.about;
    if (Array.isArray(profile.experience)) persistFields.experience = profile.experience;
    if (Array.isArray(profile.skills)) persistFields.skills = profile.skills;
    const result = await updateLinkedInProfileContent(persistFields);
    if (result.success && result.data) {
      queryClient.setQueryData(linkedinAnalysisQueryKey, result.data);
    } else if (result.success === false) {
      throw new Error(result.error);
    }
    await syncAdkContentStateOnAccept(userId, mainSessionId, payload);
    return true;
  }

  return false;
}

export function buildApplicationAssetSnapshotPayload(params: {
  content: string;
  assetType: import("@/features/application-assets/types").ApplicationAssetApiType;
  assetId?: string | null;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
}): AcceptSnapshotPayload {
  return {
    kind: "application_asset",
    content: params.content,
    assetType: params.assetType,
    assetId: params.assetId,
    role: params.role,
    company: params.company,
    jobDescription: params.jobDescription,
    contactName: params.contactName,
  };
}

export function buildContentGenSnapshotPayload(params: {
  content: string;
  topic: string;
  funnel: import("@/features/content-lab/api/adk-mappers").ContentGenFunnel | null;
  assetId?: string | null;
}): AcceptSnapshotPayload {
  return {
    kind: "content_gen",
    content: params.content,
    topic: params.topic,
    funnel: params.funnel,
    assetId: params.assetId,
  };
}

export function buildResumeSnapshotPayload(resume: ResumeData): AcceptSnapshotPayload {
  return { kind: "resume", resume };
}

export function buildPortfolioSnapshotPayload(portfolio: PortfolioData): AcceptSnapshotPayload {
  return { kind: "portfolio", portfolio };
}

export function buildLinkedInSnapshotPayload(profileKey: string, profile: LinkedInSessionProfile): AcceptSnapshotPayload {
  return { kind: "linkedin", profileKey, profile };
}
