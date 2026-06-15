"use client";

import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction } from "./actions";

const CONTENT_GEN_FUNNELS = new Set<ContentGenFunnel>(["top", "middle", "bottom"]);

function parseContentGenFunnel(raw: unknown): ContentGenFunnel | null {
  if (typeof raw === "string" && CONTENT_GEN_FUNNELS.has(raw as ContentGenFunnel)) {
    return raw as ContentGenFunnel;
  }
  return null;
}

function parseAssetType(raw: unknown): ApplicationAssetApiType | null {
  if (raw === "coverletter" || raw === "coldemail" || raw === "referral") {
    return raw;
  }
  return null;
}

/**
 * After rewind or chat mount, align Zustand + React Query with ADK session state.
 */
export async function applyAdkSessionStateToStores(
  userId: string,
  sessionId: string,
  pathname: string,
  queryClient: QueryClient,
  options?: { forceStudioHydrate?: boolean }
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

  if (pathname.startsWith("/uniboard/studio")) {
    const activeContext = state.active_context;
    if (activeContext === "application_asset") {
      const studio = useApplicationAssetStudioStore.getState();
      const assetType = parseAssetType(state.application_asset_type);
      const draftPreview = typeof state.application_asset_draft_preview === "string" ? state.application_asset_draft_preview : "";
      const acceptedContent = typeof state.application_asset_accepted_body === "string" ? state.application_asset_accepted_body : "";
      const role = typeof state.application_role === "string" ? state.application_role : studio.role;
      const company = typeof state.application_company === "string" ? state.application_company : studio.company;
      const jobDescription = typeof state.application_jd === "string" ? state.application_jd : studio.jobDescription;
      const contactName = typeof state.application_contact_name === "string" ? state.application_contact_name : studio.contactName;
      const assetIdRaw = state.application_asset_id;
      const assetId = typeof assetIdRaw === "string" && assetIdRaw.trim() ? assetIdRaw.trim() : studio.assetId;
      const nextFingerprint = `${assetType ?? ""}:${role}:${company}:${draftPreview}:${acceptedContent}`;
      const currentFingerprint = `${studio.assetType ?? ""}:${studio.role}:${studio.company}:${studio.draftPreview}:${studio.acceptedContent}`;
      if (options?.forceStudioHydrate || !studio.draftPreview.trim() || nextFingerprint !== currentFingerprint) {
        studio.syncFromStudio({
          assetType: assetType ?? studio.assetType,
          assetId,
          role,
          company,
          jobDescription,
          contactName,
          draftPreview: draftPreview || studio.draftPreview,
          acceptedContent: acceptedContent || studio.acceptedContent,
        });
        applied = true;
      }
    }

    if (activeContext === "content_gen") {
      const studio = useContentGenStudioStore.getState();
      const topic = typeof state.content_gen_topic === "string" ? state.content_gen_topic : studio.topic;
      const funnel = parseContentGenFunnel(state.content_gen_funnel) ?? studio.funnel;
      const draftPreview = typeof state.content_gen_draft_preview === "string" ? state.content_gen_draft_preview : "";
      const assetIdRaw = state.content_gen_asset_id;
      const assetId = typeof assetIdRaw === "string" && assetIdRaw.trim() ? assetIdRaw.trim() : studio.assetId;
      const nextFingerprint = `${topic}:${funnel ?? ""}:${draftPreview}:${assetId ?? ""}`;
      const currentFingerprint = `${studio.topic}:${studio.funnel ?? ""}:${studio.draftPreview}:${studio.assetId ?? ""}`;
      if (options?.forceStudioHydrate || !studio.draftPreview.trim() || nextFingerprint !== currentFingerprint) {
        studio.syncFromStudio({
          topic,
          funnel,
          assetId,
          draftPreview: draftPreview || studio.draftPreview,
        });
        applied = true;
      }
    }
  }

  return { applied };
}
