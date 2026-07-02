import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { buildStudioHref } from "@/lib/jobs/prepare-application-url";
import { resolveActiveResumeIdForPatch } from "@/src/features/adk-chat/resolve-active-resume-id";
import type { UnibotAdkSessionRow } from "./session-registry";
import { resolveRegistryContentKey } from "./sub-session-content-key";

export type SubThreadNavTarget = {
  label: string;
  href: string;
};

const STUDIO_ASSET_TYPES = new Set<ApplicationAssetApiType>(["coverletter", "coldemail", "referral"]);

function studioTypeForAsset(assetType: ApplicationAssetApiType): string {
  switch (assetType) {
    case "coverletter":
      return "cover-letter";
    case "coldemail":
      return "cold-email";
    case "referral":
      return "referral";
    default:
      return "cover-letter";
  }
}

function assetLabel(assetType: ApplicationAssetApiType): string {
  switch (assetType) {
    case "coverletter":
      return "Cover Letter";
    case "coldemail":
      return "Cold Email";
    case "referral":
      return "Referral";
    default:
      return "Document";
  }
}

function readAssetId(row: UnibotAdkSessionRow): string | undefined {
  const fid = (row.feature_id ?? "").trim();
  if (/^\d+$/.test(fid)) {
    return fid;
  }
  const key = resolveRegistryContentKey(row);
  const fromKey = key.match(/^(?:coverletter|coldemail|referral):(\d+)$/)?.[1];
  return fromKey || undefined;
}

function readLinkedInPostId(row: UnibotAdkSessionRow): string | undefined {
  const fid = (row.feature_id ?? "").trim();
  if (/^\d+$/.test(fid)) {
    return fid;
  }
  const key = resolveRegistryContentKey(row);
  return key.match(/^linkedin_post:(\d+)$/)?.[1];
}

/** Deep-link label + href for a sub-thread's underlying Studio / profile asset. */
export function resolveSubThreadNavTarget(row: UnibotAdkSessionRow | undefined): SubThreadNavTarget | null {
  if (!row || row.kind !== "sub") {
    return null;
  }

  const feature = (row.feature ?? "").trim().toLowerCase();
  const section = (row.section ?? "").trim().toLowerCase();

  if (feature === "linkedin_post" || feature === "content_gen") {
    if (section === "topic") {
      return { label: "Go to Studio", href: buildStudioHref({ type: "linkedin-post" }) };
    }
    const postId = readLinkedInPostId(row);
    return {
      label: "Go to Post",
      href: buildStudioHref({ type: "linkedin-post", ...(postId ? { id: postId } : {}) }),
    };
  }

  if (feature === "linkedin_topic") {
    return { label: "Go to Studio", href: buildStudioHref({ type: "linkedin-post" }) };
  }

  if (STUDIO_ASSET_TYPES.has(feature as ApplicationAssetApiType)) {
    const assetId = readAssetId(row);
    return {
      label: `Go to ${assetLabel(feature as ApplicationAssetApiType)}`,
      href: buildStudioHref({
        type: studioTypeForAsset(feature as ApplicationAssetApiType),
        ...(assetId ? { id: assetId } : {}),
      }),
    };
  }

  if (feature === "application_asset" && STUDIO_ASSET_TYPES.has(section as ApplicationAssetApiType)) {
    const assetType = section as ApplicationAssetApiType;
    const assetId = readAssetId(row);
    return {
      label: `Go to ${assetLabel(assetType)}`,
      href: buildStudioHref({
        type: studioTypeForAsset(assetType),
        ...(assetId ? { id: assetId } : {}),
      }),
    };
  }

  if (feature === "resume") {
    const resumeId = (row.feature_id ?? "").trim();
    if (!resumeId) {
      return { label: "Go to Resume", href: "/uniboard/resume" };
    }
    return { label: "Go to Resume", href: `/uniboard/resume?id=${encodeURIComponent(resumeId)}` };
  }

  if (feature === "linkedin") {
    return { label: "Go to LinkedIn", href: "/uniboard/linkedin" };
  }

  if (feature === "portfolio") {
    return { label: "Go to Portfolio", href: "/uniboard/portfolio" };
  }

  return null;
}

/** Resume accept/discard require the open editor resume to match the sub-thread and review card. */
export function isResumeReviewActionsInContext(
  activeResumeId: string | null | undefined,
  subRow: UnibotAdkSessionRow | undefined | null,
  reviewResumeId: string | null | undefined
): boolean {
  const active = (activeResumeId ?? "").trim();
  const subId = (subRow?.feature ?? "").toLowerCase() === "resume" ? (subRow?.feature_id ?? "").trim() : "";
  const cardId = (reviewResumeId ?? "").trim();
  const requiredId = subId || cardId;
  if (!requiredId) return true;
  if (!active || active !== requiredId) return false;
  if (subId && cardId && subId !== cardId) return false;
  return true;
}

/** Read live URL search params on the client (resume editor uses `replaceState`, not Next router). */
function readLiveSearchParams(searchParams: { get(name: string): string | null } | null | undefined): {
  get(name: string): string | null;
} {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return { get: (name: string) => params.get(name) };
  }
  return searchParams ?? { get: () => null };
}

/** True when the user's current route already matches the sub-thread asset. */
export function isSubThreadNavTargetActive(
  target: SubThreadNavTarget,
  pathname: string,
  searchParams: { get(name: string): string | null } | null | undefined
): boolean {
  try {
    const liveParams = readLiveSearchParams(searchParams);
    const targetUrl = new URL(target.href, "http://unimad.local");
    if (pathname !== targetUrl.pathname) {
      return false;
    }
    for (const [key, value] of targetUrl.searchParams.entries()) {
      if ((liveParams.get(key) ?? "").trim() !== value) {
        return false;
      }
    }
    const targetId = targetUrl.searchParams.get("id");
    const currentId =
      pathname.startsWith("/uniboard/resume") && targetUrl.pathname.startsWith("/uniboard/resume")
        ? resolveActiveResumeIdForPatch(liveParams)
        : (liveParams.get("id") ?? null);
    if (targetId && currentId && targetId !== currentId) {
      return false;
    }
    const targetType = targetUrl.searchParams.get("type");
    const currentType = liveParams.get("type");
    if (targetType && currentType && targetType !== currentType) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
