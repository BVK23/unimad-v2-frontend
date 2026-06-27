import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { buildStudioHref } from "@/lib/jobs/prepare-application-url";
import type { SubThreadNavTarget } from "./resolve-sub-thread-navigation";
import type { AdkLinkedInReviewCard } from "./stores/useAdkLinkedInReviewStore";
import type { AdkPortfolioReviewCard } from "./stores/useAdkPortfolioReviewStore";
import type { AdkReviewCard } from "./stores/useAdkResumeReviewStore";

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

export function resolveResumeReviewNavTarget(card: AdkReviewCard): SubThreadNavTarget {
  const id = card.resumeId?.trim();
  if (!id) return { label: "Go to Resume", href: "/uniboard/resume" };
  return { label: "Go to Resume", href: `/uniboard/resume?id=${encodeURIComponent(id)}` };
}

export function resolvePortfolioReviewNavTarget(_card: AdkPortfolioReviewCard): SubThreadNavTarget {
  return { label: "Go to Portfolio", href: "/uniboard/portfolio" };
}

export function resolveLinkedInReviewNavTarget(_card: AdkLinkedInReviewCard): SubThreadNavTarget {
  return { label: "Go to LinkedIn", href: "/uniboard/linkedin" };
}

export function resolveContentGenReviewNavTarget(): SubThreadNavTarget {
  return { label: "Go to Studio", href: buildStudioHref({ type: "linkedin-post" }) };
}

export function resolveApplicationAssetReviewNavTarget(input: {
  assetType: ApplicationAssetApiType;
  assetId?: string | null;
}): SubThreadNavTarget {
  const label =
    input.assetType === "coverletter" ? "Go to Cover Letter" : input.assetType === "coldemail" ? "Go to Cold Email" : "Go to Referral";
  return {
    label,
    href: buildStudioHref({
      type: studioTypeForAsset(input.assetType),
      ...(input.assetId ? { id: input.assetId } : {}),
    }),
  };
}
