"use client";

import { useResumeStore } from "@/src/features/resume/store/useResumeStore";
import type { ContentScope } from "./content-scope";
import { resolveScopedAssetId } from "./content-scope";

export type FeatureAvailability = "available" | "missing" | "unknown";

/**
 * Best-effort check that the feature asset still exists in client caches.
 * "unknown" means we cannot tell — treat as available for navigation CTAs.
 */
export function checkFeatureAvailability(
  scope: ContentScope | null | undefined,
  options?: { knownResumeIds?: Iterable<string> }
): FeatureAvailability {
  if (!scope?.contentKey) return "unknown";

  if (scope.domain === "resume") {
    const resumeId = scope.contentKey.split(":")[1]?.trim();
    if (!resumeId || resumeId === "active") return "available";
    if (useResumeStore.getState().getResumeData(resumeId)) return "available";
    if (options?.knownResumeIds) {
      const ids = new Set(Array.from(options.knownResumeIds, id => String(id)));
      if (ids.size > 0) {
        return ids.has(resumeId) ? "available" : "missing";
      }
    }
    return "unknown";
  }

  if (scope.domain === "portfolio" || scope.domain === "linkedin") {
    return "available";
  }

  if (scope.domain === "application_asset" || scope.domain === "content_gen") {
    const assetId = resolveScopedAssetId(scope);
    if (!assetId) return "available";
    return "unknown";
  }

  return "unknown";
}
