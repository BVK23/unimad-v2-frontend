"use client";

import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { setLivePortfolioQueryData } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { extractLinkedInSessionProfileFromAdkState, mapLinkedInSessionProfileToSnapshot } from "@/src/features/linkedin/api/adk-mappers";
import { linkedinAnalysisQueryKey } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import type { LinkedInAnalysisSnapshot } from "@/src/features/linkedin/types";
import { mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction } from "./actions";
import type { ContentScope } from "./content-scope";
import { resolveAdkSessionOptionsForSessionId } from "./resolve-sub-session-adk-app";
import { noteAdkSessionSynced } from "./rewind-state-divergence";

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
  options?: { forceStudioHydrate?: boolean; targetScope?: ContentScope | null; afterRewind?: boolean }
): Promise<{ applied: boolean; error?: string }> {
  const adkOptions = resolveAdkSessionOptionsForSessionId(sessionId);
  const pullResult = await pullSessionStateAction(userId, sessionId, adkOptions);
  if (!pullResult.success || !pullResult.state) {
    return {
      applied: false,
      error: pullResult.error ?? "Could not read ADK session state.",
    };
  }

  const state = pullResult.state;
  let applied = false;

  const targetDomain = options?.targetScope?.domain ?? null;
  const shouldApplyResume = pathname.startsWith("/uniboard/resume") || targetDomain === "resume";
  const shouldApplyPortfolio = pathname.startsWith("/uniboard/portfolio") || targetDomain === "portfolio";
  const shouldApplyStudio =
    pathname.startsWith("/uniboard/studio") || targetDomain === "application_asset" || targetDomain === "content_gen";
  const shouldApplyLinkedIn = pathname.startsWith("/uniboard/linkedin") || targetDomain === "linkedin";

  if (shouldApplyResume && state.resume_data) {
    const nextResumes = mapAdkResumeDataMapToFrontend(state.resume_data);
    const currentResumeIdRaw = state.current_resume;
    const scopedResumeId = options?.targetScope?.domain === "resume" ? options.targetScope.contentKey.split(":")[1]?.trim() : null;
    const currentResumeId =
      (typeof currentResumeIdRaw === "string" && currentResumeIdRaw.trim().length > 0 ? currentResumeIdRaw.trim() : null) ??
      scopedResumeId ??
      null;
    // Merge so other open resumes in Zustand are not wiped by a sub-session snapshot.
    useResumeStore.setState(prev => ({
      resumeData: { ...prev.resumeData, ...nextResumes },
    }));
    const resumeToCache = (currentResumeId && nextResumes[currentResumeId]) || Object.values(nextResumes)[0];
    if (currentResumeId && resumeToCache) {
      queryClient.setQueryData(resumeByIdQueryKey(currentResumeId), resumeToCache);
    } else if (resumeToCache?.id) {
      queryClient.setQueryData(resumeByIdQueryKey(String(resumeToCache.id)), resumeToCache);
    }
    applied = true;
  }

  if (shouldApplyPortfolio && state.portfolio_data) {
    const nextPortfolios = mapAdkPortfolioDataMapToFrontend(state.portfolio_data);
    const currentPortfolioIdRaw = state.current_portfolio;
    const currentPortfolioId =
      typeof currentPortfolioIdRaw === "string" && currentPortfolioIdRaw.trim().length > 0 ? currentPortfolioIdRaw.trim() : null;
    usePortfolioStore.setState(prev => ({
      portfolioData: { ...prev.portfolioData, ...nextPortfolios },
    }));
    if (currentPortfolioId && nextPortfolios[currentPortfolioId]) {
      setLivePortfolioQueryData(queryClient, nextPortfolios[currentPortfolioId]);
    }
    applied = true;
  }

  if (shouldApplyStudio) {
    const afterRewind = options?.afterRewind === true;
    const activeContext = state.active_context;
    if (activeContext === "application_asset") {
      const studio = useApplicationAssetStudioStore.getState();
      const assetType = parseAssetType(state.application_asset_type);
      const draftPreview = (() => {
        const data = state.application_asset_data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const rows = data as Record<string, { body?: string }>;
          const activeKey = typeof state.current_application_asset === "string" ? state.current_application_asset : "active";
          const body = rows[activeKey]?.body ?? Object.values(rows)[0]?.body;
          if (typeof body === "string" && body.trim()) return body.trim();
        }
        return typeof state.application_asset_draft_preview === "string" ? state.application_asset_draft_preview : "";
      })();
      const acceptedContent =
        typeof state.application_asset_accepted_body === "string" && state.application_asset_accepted_body.trim()
          ? state.application_asset_accepted_body
          : draftPreview;
      const role = typeof state.application_role === "string" ? state.application_role : studio.role;
      const company = typeof state.application_company === "string" ? state.application_company : studio.company;
      const jobDescription = typeof state.application_jd === "string" ? state.application_jd : studio.jobDescription;
      const resolvedAssetType = assetType ?? studio.assetType;
      const contactName =
        resolvedAssetType === "coverletter"
          ? ""
          : typeof state.application_contact_name === "string"
            ? state.application_contact_name
            : studio.contactName;
      const assetIdRaw = state.application_asset_id;
      const assetId = typeof assetIdRaw === "string" && assetIdRaw.trim() ? assetIdRaw.trim() : studio.assetId;
      const nextFingerprint = `${assetType ?? ""}:${role}:${company}:${draftPreview}:${acceptedContent}`;
      const currentFingerprint = `${studio.assetType ?? ""}:${studio.role}:${studio.company}:${studio.draftPreview}:${studio.acceptedContent}`;
      if (afterRewind || options?.forceStudioHydrate || !studio.draftPreview.trim() || nextFingerprint !== currentFingerprint) {
        studio.syncFromStudio({
          assetType: assetType ?? studio.assetType,
          assetId,
          role,
          company,
          jobDescription,
          contactName,
          draftPreview: afterRewind ? draftPreview : draftPreview || studio.draftPreview,
          acceptedContent: afterRewind ? acceptedContent : acceptedContent || studio.acceptedContent,
        });
        applied = true;
      }
    }

    if (activeContext === "content_gen") {
      const studio = useContentGenStudioStore.getState();
      const topic = typeof state.content_gen_topic === "string" ? state.content_gen_topic : studio.topic;
      const funnel = parseContentGenFunnel(state.content_gen_funnel) ?? studio.funnel;
      const moodRaw = state.content_gen_mood;
      const mood = typeof moodRaw === "string" && moodRaw.trim() ? moodRaw.trim() : studio.mood;
      const draftPreview = (() => {
        const data = state.content_gen_data;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const rows = data as Record<string, { body?: string }>;
          const activeKey = typeof state.current_content_gen === "string" ? state.current_content_gen : "active";
          const body = rows[activeKey]?.body ?? Object.values(rows)[0]?.body;
          if (typeof body === "string" && body.trim()) return body.trim();
        }
        return typeof state.content_gen_draft_preview === "string" ? state.content_gen_draft_preview : "";
      })();
      const assetIdRaw = state.content_gen_asset_id;
      const assetId = typeof assetIdRaw === "string" && assetIdRaw.trim() ? assetIdRaw.trim() : studio.assetId;
      const nextFingerprint = `${topic}:${funnel ?? ""}:${mood}:${draftPreview}:${assetId ?? ""}`;
      const currentFingerprint = `${studio.topic}:${studio.funnel ?? ""}:${studio.mood}:${studio.draftPreview}:${studio.assetId ?? ""}`;
      if (afterRewind || options?.forceStudioHydrate || !studio.draftPreview.trim() || nextFingerprint !== currentFingerprint) {
        studio.syncFromStudio({
          topic,
          funnel,
          mood,
          assetId,
          draftPreview: afterRewind ? draftPreview : draftPreview || studio.draftPreview,
        });
        applied = true;
      }
    }
  }

  if (shouldApplyLinkedIn && state.linkedin_data) {
    const profile = extractLinkedInSessionProfileFromAdkState(state);
    if (profile) {
      const previous = queryClient.getQueryData<LinkedInAnalysisSnapshot | null | undefined>(linkedinAnalysisQueryKey);
      queryClient.setQueryData(linkedinAnalysisQueryKey, mapLinkedInSessionProfileToSnapshot(profile, previous ?? null));
      applied = true;
    }
  }

  if (applied && options?.targetScope) {
    noteAdkSessionSynced(options.targetScope);
  }

  return { applied };
}
