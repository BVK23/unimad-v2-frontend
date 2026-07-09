import { buildStudioHref } from "@/lib/jobs/prepare-application-url";
import { resolveActiveResumeIdForPatch } from "@/src/features/adk-chat/resolve-active-resume-id";
import {
  buildLinkedInPostContentKey,
  buildStudioAssetContentKey,
  resolveRegistryContentKey,
} from "@/src/features/adk-chat/sub-session-content-key";
import type { ContentGeneratorType } from "@/types/jobs";
import { getRegistryRow, type UnibotAdkSessionRow, type UnibotSessionKind } from "./session-registry";

export { buildStudioAssetContentKey as buildApplicationAssetContentKey } from "@/src/features/adk-chat/sub-session-content-key";

export type ContentDomain = "resume" | "portfolio" | "linkedin" | "content_gen" | "application_asset" | "general";

export type ScopeMatch = "full" | "partial" | "cross_domain";

export type ContentScope = {
  domain: ContentDomain;
  contentKey: string;
  section?: string;
  entryId?: string;
  adkSessionId: string;
  sessionKind: UnibotSessionKind;
};

type SearchParamsInput = { get(name: string): string | null } | null | undefined;

type ActiveScopeInput = {
  pathname: string | null;
  searchParams?: SearchParamsInput;
  sessionId: string;
  sessionKind?: UnibotSessionKind;
  resumeId?: string | null;
  portfolioId?: string | null;
  studioType?: string | null;
  applicationAsset?: {
    assetId?: string | null;
    role?: string | null;
    company?: string | null;
  };
  contentGen?: {
    assetId?: string | null;
    topic?: string | null;
  };
};

function normalizePart(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getStudioTopicType(searchParams?: SearchParamsInput, fallback?: string | null): string {
  const fromParams = searchParams?.get("type");
  return (fromParams ?? fallback ?? "").trim().toLowerCase();
}

function mapStudioTypeToAssetType(studioType: string): "coverletter" | "coldemail" | "referral" | null {
  if (studioType === "cover-letter") return "coverletter";
  if (studioType === "cold-email") return "coldemail";
  if (studioType === "referral") return "referral";
  return null;
}

export function buildContentGenContentKey(params: { assetId?: string | null; topic?: string | null }): string {
  return buildLinkedInPostContentKey(params);
}

export function deriveActiveScope(input: ActiveScopeInput): ContentScope {
  const sessionKind = input.sessionKind ?? "main";
  const pathname = input.pathname ?? "";

  if (pathname.startsWith("/uniboard/resume")) {
    const resumeId = nonEmpty(input.resumeId) ?? nonEmpty(resolveActiveResumeIdForPatch(input.searchParams ?? null)) ?? "active";
    return {
      domain: "resume",
      contentKey: `resume:${resumeId}`,
      adkSessionId: input.sessionId,
      sessionKind,
    };
  }

  if (pathname.startsWith("/uniboard/portfolio")) {
    const portfolioId = nonEmpty(input.portfolioId) ?? "active";
    return {
      domain: "portfolio",
      contentKey: `portfolio:${portfolioId}`,
      adkSessionId: input.sessionId,
      sessionKind,
    };
  }

  if (pathname.startsWith("/uniboard/linkedin")) {
    return {
      domain: "linkedin",
      contentKey: "linkedin:profile",
      adkSessionId: input.sessionId,
      sessionKind,
    };
  }

  if (pathname.startsWith("/uniboard/studio")) {
    const studioType = getStudioTopicType(input.searchParams, input.studioType);
    const assetType = mapStudioTypeToAssetType(studioType);
    if (assetType) {
      return {
        domain: "application_asset",
        contentKey: buildStudioAssetContentKey({
          assetType,
          assetId: input.applicationAsset?.assetId,
          role: input.applicationAsset?.role,
          company: input.applicationAsset?.company,
        }),
        section: assetType,
        adkSessionId: input.sessionId,
        sessionKind,
      };
    }
    return {
      domain: "content_gen",
      contentKey: buildContentGenContentKey({
        assetId: input.contentGen?.assetId,
        topic: input.contentGen?.topic,
      }),
      adkSessionId: input.sessionId,
      sessionKind,
    };
  }

  return {
    domain: "general",
    contentKey: `general:${input.sessionId}`,
    adkSessionId: input.sessionId,
    sessionKind,
  };
}

export function inferDomainFromFeature(feature: string | null | undefined): ContentDomain {
  const normalized = (feature ?? "").trim().toLowerCase();
  if (normalized === "application_asset" || normalized === "coverletter" || normalized === "coldemail" || normalized === "referral") {
    return "application_asset";
  }
  if (normalized === "content_gen" || normalized === "linkedin_post" || normalized === "linkedin_topic") {
    return "content_gen";
  }
  if (normalized === "portfolio") return "portfolio";
  if (normalized === "linkedin") return "linkedin";
  if (normalized === "resume") return "resume";
  return "general";
}

export function deriveScopeFromRegistryRow(row: UnibotAdkSessionRow): ContentScope {
  const domain = inferDomainFromFeature(row.feature);
  const contentKey = resolveRegistryContentKey(row);
  const studioSection =
    domain === "application_asset"
      ? row.feature && ["coverletter", "coldemail", "referral"].includes(row.feature)
        ? row.feature
        : row.section
      : row.section;

  return {
    domain,
    contentKey,
    section: studioSection ?? undefined,
    entryId: row.entry_id || undefined,
    adkSessionId: row.adk_session_id,
    sessionKind: row.kind,
  };
}

export function deriveScopeFromTopicKind(params: {
  topicKind?: "content_gen" | "application_asset" | "improve";
  subSessionAdkId?: string;
  registryRow?: UnibotAdkSessionRow;
}): ContentScope | null {
  if (params.registryRow) {
    return deriveScopeFromRegistryRow(params.registryRow);
  }
  if (!params.subSessionAdkId) {
    return null;
  }
  const fallbackDomain: ContentDomain =
    params.topicKind === "application_asset" ? "application_asset" : params.topicKind === "content_gen" ? "content_gen" : "general";
  return {
    domain: fallbackDomain,
    contentKey: `${fallbackDomain}:${params.subSessionAdkId}`,
    adkSessionId: params.subSessionAdkId,
    sessionKind: "sub",
  };
}

export function scopeAssetKey(scope: ContentScope): string {
  const parts = scope.contentKey.split(":");
  if (scope.domain === "resume" || scope.domain === "portfolio") {
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : scope.contentKey;
  }
  if (scope.domain === "linkedin") {
    return parts[0] === "linkedin" && parts[1] ? `linkedin:${parts[1]}` : scope.contentKey;
  }
  return scope.contentKey;
}

export function scopesShareSameAsset(activeScope: ContentScope, messageScope: ContentScope): boolean {
  if (activeScope.domain !== messageScope.domain) return false;
  if (activeScope.contentKey === messageScope.contentKey) return true;
  return scopeAssetKey(activeScope) === scopeAssetKey(messageScope);
}

export function scopesMatch(activeScope: ContentScope, messageScope: ContentScope): ScopeMatch {
  if (activeScope.domain !== messageScope.domain) return "cross_domain";
  if (activeScope.contentKey === messageScope.contentKey) return "full";
  if (scopesShareSameAsset(activeScope, messageScope)) return "full";
  return "partial";
}

function applicationAssetScopeLabel(scope: ContentScope): string {
  const assetType = (scope.section ?? scope.contentKey.split(":")[0] ?? "").trim().toLowerCase();
  if (assetType === "coverletter") return "Cover Letter";
  if (assetType === "coldemail") return "Cold Email";
  if (assetType === "referral") return "Referral Request";
  return "Studio";
}

export function getScopeDisplayName(scope: ContentScope | null | undefined): string {
  if (!scope) return "this context";
  if (scope.domain === "resume") return "Resume";
  if (scope.domain === "portfolio") return "Portfolio";
  if (scope.domain === "linkedin") return "LinkedIn";
  if (scope.domain === "content_gen") return "LinkedIn Post";
  if (scope.domain === "application_asset") return applicationAssetScopeLabel(scope);
  return "this context";
}

function mapAssetApiTypeToStudioType(assetType: string | null | undefined): ContentGeneratorType | null {
  const normalized = (assetType ?? "").trim().toLowerCase();
  if (normalized === "coverletter") return "cover-letter";
  if (normalized === "coldemail") return "cold-email";
  if (normalized === "referral") return "referral";
  return null;
}

/** Registry feature_id or content_key tail when it is a persisted asset id (not company|role scope). */
export function resolveScopedAssetId(scope: ContentScope): string | undefined {
  const entryId = nonEmpty(scope.entryId);
  if (entryId && !entryId.includes("|")) {
    return entryId;
  }

  const keyParts = scope.contentKey.split(":");
  const idPart = keyParts[1]?.trim();
  if (idPart && idPart !== "scope" && idPart !== "topic" && !idPart.includes("|") && /^\d+$/.test(idPart)) {
    return idPart;
  }

  const legacyThird = keyParts[2]?.trim();
  if (legacyThird && legacyThird !== "active" && !legacyThird.includes("|") && /^\d+$/.test(legacyThird)) {
    return legacyThird;
  }

  return undefined;
}

/** Prefer sub-session registry row so redirects include entry_id / section from Django. */
export function resolveRewindRedirectScope(
  targetSessionId: string,
  messageScope: ContentScope | null | undefined
): ContentScope | null | undefined {
  const targetRow = getRegistryRow(targetSessionId.trim());
  if (targetRow) {
    return deriveScopeFromRegistryRow(targetRow);
  }
  return messageScope;
}

export function getRedirectPathForScope(scope: ContentScope | null | undefined): string | null {
  if (!scope) return null;
  if (scope.domain === "resume") {
    const rawId = scope.contentKey.split(":")[1];
    const resumeId = rawId && rawId !== "active" ? rawId : null;
    return resumeId ? `/uniboard/resume?id=${encodeURIComponent(resumeId)}` : "/uniboard/resume";
  }
  if (scope.domain === "portfolio") {
    return "/uniboard/portfolio";
  }
  if (scope.domain === "linkedin") {
    return "/uniboard/linkedin";
  }
  if (scope.domain === "application_asset") {
    const assetType = scope.section ?? scope.contentKey.split(":")[0] ?? "";
    const studioType = mapAssetApiTypeToStudioType(assetType);
    if (!studioType) {
      return "/uniboard/studio";
    }
    const assetId = resolveScopedAssetId(scope);
    return buildStudioHref({ type: studioType, id: assetId });
  }
  if (scope.domain === "content_gen") {
    const assetId = resolveScopedAssetId(scope);
    return buildStudioHref({ type: "linkedin-post", id: assetId });
  }
  return null;
}

/** Human label for rewind dialog copy on the current feature page (includes possessive where natural). */
export function getContentScopeFeatureLabel(scope: ContentScope | null | undefined): string {
  if (!scope) return "this page";
  switch (scope.domain) {
    case "resume":
      return "your resume";
    case "portfolio":
      return "your portfolio";
    case "linkedin":
      return "your LinkedIn profile";
    case "application_asset":
      return "this application asset";
    case "content_gen":
      return "this post";
    default:
      return "this page";
  }
}

/** Short label for cross-domain rewind redirect CTAs. */
export function getContentScopeRedirectLabel(scope: ContentScope | null | undefined): string | undefined {
  if (!scope) return undefined;
  switch (scope.domain) {
    case "resume":
      return "Resume";
    case "portfolio":
      return "Portfolio";
    case "linkedin":
      return "LinkedIn";
    case "application_asset": {
      const assetType = (scope.section ?? scope.contentKey.split(":")[0] ?? "").trim().toLowerCase();
      if (assetType === "coverletter") return "Cover letter";
      if (assetType === "coldemail") return "Cold email";
      if (assetType === "referral") return "Referral";
      return "Studio";
    }
    case "content_gen":
      return "LinkedIn post";
    default:
      return undefined;
  }
}
