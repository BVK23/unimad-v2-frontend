"use client";

import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import { offerApplicationAssetDraftReview } from "@/features/application-assets/api/offerApplicationAssetDraftReview";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { extractApplicationAssetDraftFromSessionState } from "@/features/application-assets/utils/extractApplicationAssetDraftFromSessionState";
import { CONTENT_GEN_EVENTS } from "@/features/content-lab/api/content-gen-events";
import { CONTENT_GEN_MIN_DRAFT_CHARS } from "@/features/content-lab/api/contentGenDraftConfig";
import { extractContentGenDraftFromAdkState } from "@/features/content-lab/api/extractContentGenDraftFromAdkState";
import { offerContentGenDraftReview } from "@/features/content-lab/api/offerContentGenDraftReview";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { mapAdkPortfolioDataMapToFrontend } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import {
  extractLinkedInSessionProfileFromAdkState,
  mapLinkedInSessionProfileToSnapshot,
  mapSnapshotToLinkedInSessionProfile,
  type LinkedInSessionProfile,
} from "@/src/features/linkedin/api/adk-mappers";
import { LINKEDIN_ADK_PROFILE_KEY } from "@/src/features/linkedin/constants";
import { linkedinAnalysisQueryKey } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import type { LinkedInAnalysisSnapshot } from "@/src/features/linkedin/types";
import { mapAdkResumeDataMapToFrontend } from "@/src/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/src/features/resume/hooks/useResume";
import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { PortfolioData, ResumeData } from "@/types";
import type { QueryClient } from "@tanstack/react-query";
import { pullSessionStateAction } from "./actions";
import { computeAdkLinkedInReviewFromDiff } from "./adkLinkedInHighlightDiff";
import { computeAdkPortfolioReviewFromDiff } from "./adkPortfolioHighlightDiff";
import { computeAdkReviewFromDiff } from "./adkResumeHighlightDiff";
import { deriveScopeFromRegistryRow } from "./content-scope";
import { resolveAdkSessionOptionsForSessionId } from "./resolve-sub-session-adk-app";
import { noteAdkSessionSynced } from "./rewind-state-divergence";
import { mutatingToolDomain, type MutatingSessionDomain } from "./session-mutating-tools";
import { getRegistryRow } from "./session-registry";
import { useAdkLinkedInReviewStore } from "./stores/useAdkLinkedInReviewStore";
import { useAdkPortfolioReviewStore } from "./stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore } from "./stores/useAdkResumeReviewStore";
import { isAdkActivityTraceEnabled } from "./streaming/activity-trace";

export type MutatingToolPullContext = {
  userId: string;
  sessionId: string;
  toolName: string;
  assistantMessageId: string | null;
  pathname: string;
  resumeId: string | null;
  portfolioId: string | null;
  linkedInSnapshot: LinkedInAnalysisSnapshot | null | undefined;
  queryClient: QueryClient;
  baselines: {
    resume: ResumeData | null;
    portfolio: PortfolioData | null;
    linkedIn: LinkedInSessionProfile | null;
  };
};

function parseAssetType(raw: unknown): ApplicationAssetApiType | null {
  if (raw === "coverletter" || raw === "coldemail" || raw === "referral") {
    return raw;
  }
  return null;
}

function resolveResumeIdForPull(ctx: MutatingToolPullContext): string | null {
  const registryRow = getRegistryRow(ctx.sessionId);
  const fromRegistry = registryRow?.feature === "resume" ? (registryRow.feature_id ?? "").trim() : "";
  if (fromRegistry) return fromRegistry;
  const fromCtx = ctx.resumeId?.trim();
  return fromCtx || null;
}

function applyResumeState(state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  const nextResumes = mapAdkResumeDataMapToFrontend(state.resume_data);
  const scopedResumeId = resolveResumeIdForPull(ctx);
  if (!scopedResumeId) return;

  const sourceResume = nextResumes[scopedResumeId];
  if (!sourceResume) return;

  const baseline = ctx.baselines.resume;
  if (baseline && ctx.assistantMessageId?.trim()) {
    const { highlights, bannerTitle } = computeAdkReviewFromDiff(baseline, sourceResume);
    if (Object.keys(highlights).length > 0) {
      useAdkResumeReviewStore.getState().beginReview({
        resumeId: scopedResumeId,
        baselineResume: baseline,
        highlights,
        bannerTitle,
        assistantMessageId: ctx.assistantMessageId,
      });
    }
  }

  useResumeStore.setState(current => ({
    resumeData: { ...current.resumeData, ...nextResumes },
  }));
  ctx.queryClient.setQueryData(resumeByIdQueryKey(scopedResumeId), sourceResume);
}

function applyPortfolioState(state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  const nextPortfolios = mapAdkPortfolioDataMapToFrontend(state.portfolio_data);
  const currentPortfolioIdRaw = state.current_portfolio;
  const currentPortfolioId =
    typeof currentPortfolioIdRaw === "string" && currentPortfolioIdRaw.trim().length > 0 ? currentPortfolioIdRaw.trim() : ctx.portfolioId;
  const sourcePortfolio = currentPortfolioId ? nextPortfolios[currentPortfolioId] : undefined;
  if (!currentPortfolioId || !sourcePortfolio) return;

  const baseline = ctx.baselines.portfolio;
  if (baseline && ctx.assistantMessageId?.trim()) {
    const { highlights, bannerTitle } = computeAdkPortfolioReviewFromDiff(baseline, sourcePortfolio);
    if (Object.keys(highlights).length > 0) {
      useAdkPortfolioReviewStore.getState().beginReview({
        portfolioId: currentPortfolioId,
        baselinePortfolio: baseline,
        highlights,
        bannerTitle,
        assistantMessageId: ctx.assistantMessageId,
      });
    }
  }

  usePortfolioStore.setState({ portfolioData: nextPortfolios });
  ctx.queryClient.setQueryData(portfolioQueryKey, nextPortfolios[currentPortfolioId]);
}

function applyLinkedInState(state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  const profile = extractLinkedInSessionProfileFromAdkState(state);
  if (!profile) return;

  const baseline = ctx.baselines.linkedIn;
  const previous = ctx.linkedInSnapshot ?? ctx.queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
  const nextSnapshot = mapLinkedInSessionProfileToSnapshot(profile, previous ?? null);

  if (baseline && ctx.assistantMessageId?.trim()) {
    const { highlights, bannerTitle } = computeAdkLinkedInReviewFromDiff(baseline, profile);
    if (Object.keys(highlights).length > 0) {
      useAdkLinkedInReviewStore.getState().beginReview({
        profileKey: LINKEDIN_ADK_PROFILE_KEY,
        baselineProfile: baseline,
        highlights,
        bannerTitle,
        assistantMessageId: ctx.assistantMessageId,
      });
    }
  }

  ctx.queryClient.setQueryData(linkedinAnalysisQueryKey, nextSnapshot);
}

function applyContentGenState(state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  const extracted = extractContentGenDraftFromAdkState(state);
  if (!extracted?.draft) return;

  const studio = useContentGenStudioStore.getState();
  studio.syncFromStudio({
    topic: extracted.topic ?? studio.topic,
    funnel: extracted.funnel ?? studio.funnel,
    mood: extracted.mood ?? studio.mood,
    draftPreview: extracted.draft,
    assetId: typeof state.content_gen_asset_id === "string" ? state.content_gen_asset_id : studio.assetId,
  });

  if (!ctx.assistantMessageId) return;

  offerContentGenDraftReview({
    botMessage: "",
    assistantMessageId: ctx.assistantMessageId,
    pathname: ctx.pathname,
    proposedDraftOverride: extracted.draft,
    topicOverride: extracted.topic,
    funnelOverride: extracted.funnel ?? null,
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    forceStudioPreview: true,
  });
}

function resolveReviewSessionId(sessionId: string): string {
  const row = getRegistryRow(sessionId);
  if (row?.kind === "sub" && row.parent_adk_session_id?.trim()) {
    return row.parent_adk_session_id.trim();
  }
  return sessionId;
}

/** Mid-pipeline preview only — no Accept/Improve card until the SSE run finishes. */
export async function syncContentGenDraftPreviewOnly(userId: string, sessionId: string): Promise<void> {
  const options = resolveAdkSessionOptionsForSessionId(sessionId);
  const pullResult = await pullSessionStateAction(userId, sessionId, options);
  if (!pullResult.success || !pullResult.state) return;

  const state = pullResult.state;
  const extracted = extractContentGenDraftFromAdkState(state);
  if (!extracted?.draft || extracted.draft.length < CONTENT_GEN_MIN_DRAFT_CHARS) return;

  const studio = useContentGenStudioStore.getState();
  studio.syncFromStudio({
    topic: extracted.topic ?? studio.topic,
    funnel: extracted.funnel ?? studio.funnel,
    mood: extracted.mood ?? studio.mood,
    draftPreview: extracted.draft,
    assetId: typeof state.content_gen_asset_id === "string" ? state.content_gen_asset_id : studio.assetId,
  });

  window.dispatchEvent(
    new CustomEvent(CONTENT_GEN_EVENTS.draftPreview, {
      detail: {
        draft: extracted.draft,
        topic: extracted.topic ?? studio.topic,
        funnel: extracted.funnel ?? studio.funnel,
        assetId: typeof state.content_gen_asset_id === "string" ? state.content_gen_asset_id : studio.assetId,
      },
    })
  );
}

function applyApplicationAssetState(state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  const draft = extractApplicationAssetDraftFromSessionState(state);
  if (!draft || !ctx.assistantMessageId) {
    if (process.env.NODE_ENV !== "production" && ctx.toolName.toLowerCase().includes("application_asset")) {
      console.warn("[application-asset-pull] skip: empty draft or missing assistantMessageId", {
        tool: ctx.toolName,
        draftChars: draft?.length ?? 0,
        assistantMessageId: ctx.assistantMessageId,
      });
    }
    return;
  }

  const studio = useApplicationAssetStudioStore.getState();
  const pendingRefine = studio.pendingRefineContext;
  const baselineDraft = pendingRefine?.baselineDraft?.trim() || studio.acceptedContent.trim() || studio.draftPreview.trim();
  const assetType = parseAssetType(state.application_asset_type) ?? studio.assetType ?? "coverletter";
  const role = typeof state.application_role === "string" ? state.application_role : studio.role;
  const company = typeof state.application_company === "string" ? state.application_company : studio.company;
  const jobDescription = typeof state.application_jd === "string" ? state.application_jd : studio.jobDescription;
  // Cover letters must not inherit personal names from session (stale referral/cold-email contact).
  const contactName =
    assetType === "coverletter"
      ? ""
      : typeof state.application_contact_name === "string"
        ? state.application_contact_name
        : studio.contactName;
  const reviewSessionId = resolveReviewSessionId(ctx.sessionId);

  const offered = offerApplicationAssetDraftReview({
    botMessage: "",
    assistantMessageId: ctx.assistantMessageId,
    pathname: ctx.pathname,
    assetTypeOverride: assetType,
    proposedDraftOverride: draft,
    baselineDraftOverride: baselineDraft,
    userId: ctx.userId,
    sessionId: reviewSessionId,
    forceStudioPreview: true,
  });

  if (isAdkActivityTraceEnabled()) {
    console.info("[application-asset-pull] session GET applied", {
      tool: ctx.toolName,
      offered,
      draftChars: draft.length,
      baselineChars: baselineDraft.length,
      reviewSessionId,
      pullSessionId: ctx.sessionId,
      assistantMessageId: ctx.assistantMessageId,
    });
  }

  if (!offered && process.env.NODE_ENV !== "production") {
    console.warn("[application-asset-pull] offerApplicationAssetDraftReview returned false", {
      tool: ctx.toolName,
      draftChars: draft.length,
      reviewSessionId,
      pullSessionId: ctx.sessionId,
      assetType,
      baselineChars: baselineDraft.length,
    });
  }
}

function applyDomainState(domain: MutatingSessionDomain, state: Record<string, unknown>, ctx: MutatingToolPullContext): void {
  switch (domain) {
    case "resume":
      applyResumeState(state, ctx);
      break;
    case "portfolio":
      applyPortfolioState(state, ctx);
      break;
    case "linkedin":
      applyLinkedInState(state, ctx);
      break;
    case "content_gen":
      applyContentGenState(state, ctx);
      break;
    case "application_asset":
      applyApplicationAssetState(state, ctx);
      break;
    default:
      break;
  }
}

const APPLICATION_ASSET_PULL_INITIAL_DELAY_MS = 1000;
const APPLICATION_ASSET_PULL_RETRY_DELAY_MS = 600;
const APPLICATION_ASSET_PULL_MAX_ATTEMPTS = 3;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function shouldRetryApplicationAssetPull(toolName: string): boolean {
  const normalized = toolName.trim().toLowerCase();
  return normalized === "update_application_asset_draft" || normalized === "generate_application_asset_draft";
}

async function pullSessionStateForMutatingTool(ctx: MutatingToolPullContext): Promise<Record<string, unknown> | null> {
  const options = resolveAdkSessionOptionsForSessionId(ctx.sessionId);
  const retry = shouldRetryApplicationAssetPull(ctx.toolName);
  const attempts = retry ? APPLICATION_ASSET_PULL_MAX_ATTEMPTS : 1;
  let lastState: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const delayMs = attempt === 0 ? (retry ? APPLICATION_ASSET_PULL_INITIAL_DELAY_MS : 0) : APPLICATION_ASSET_PULL_RETRY_DELAY_MS;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    const pullResult = await pullSessionStateAction(ctx.userId, ctx.sessionId, options);
    if (!pullResult.success || !pullResult.state) {
      continue;
    }
    lastState = pullResult.state;
    if (!retry) {
      return lastState;
    }
    const draft = extractApplicationAssetDraftFromSessionState(pullResult.state).trim();
    if (draft.length >= APPLICATION_ASSET_MIN_DRAFT_CHARS) {
      return lastState;
    }
  }

  return lastState;
}

/** GET session after a mutating tool and apply only the relevant domain to stores. */
export async function applyMutatingToolSessionPull(ctx: MutatingToolPullContext): Promise<void> {
  const domain = mutatingToolDomain(ctx.toolName);
  if (!domain) return;

  const state = await pullSessionStateForMutatingTool(ctx);
  if (!state) {
    return;
  }

  applyDomainState(domain, state, ctx);

  const registryRow = getRegistryRow(ctx.sessionId);
  if (registryRow) {
    noteAdkSessionSynced(deriveScopeFromRegistryRow(registryRow));
  }
}
