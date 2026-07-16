import type { BackendJob } from "@/features/jobs/types";
import { mapBackendJobToUi } from "@/lib/jobs/job-ui-mappers";
import type { Job } from "@/types/jobs";

export type UnimadJobCardsPayload = {
  jobs: Job[];
  seeMorePath?: string;
  seeMoreLabel?: string;
};

export function parseJobCardsFromToolResponse(response: Record<string, unknown> | undefined): UnimadJobCardsPayload | null {
  if (!response || response.status !== "ok") return null;

  const ui = response.ui;
  let seeMorePath: string | undefined;
  let seeMoreLabel: string | undefined;
  const topLevelPath = response.path;
  const topLevelLabel = response.label;
  if (typeof topLevelPath === "string" && topLevelPath.trim()) {
    seeMorePath = topLevelPath.trim();
    if (typeof topLevelLabel === "string" && topLevelLabel.trim()) seeMoreLabel = topLevelLabel.trim();
  } else if (ui && typeof ui === "object") {
    const nav = (ui as Record<string, unknown>).navigation;
    if (nav && typeof nav === "object") {
      const path = (nav as Record<string, unknown>).path;
      const label = (nav as Record<string, unknown>).label;
      if (typeof path === "string" && path.trim()) seeMorePath = path.trim();
      if (typeof label === "string" && label.trim()) seeMoreLabel = label.trim();
    }
  }

  const fullJobs = Array.isArray(response.jobs) ? (response.jobs as BackendJob[]) : [];
  const uiCards = ui && typeof ui === "object" ? (ui as Record<string, unknown>).job_cards : null;
  const cardIds =
    Array.isArray(uiCards) && uiCards.length > 0
      ? new Set(uiCards.map(c => (c && typeof c === "object" ? String((c as Record<string, unknown>).id ?? "") : "")).filter(Boolean))
      : null;

  const selected = cardIds ? fullJobs.filter(j => cardIds.has(String(j.id))) : fullJobs.slice(0, 5);

  if (selected.length === 0) return null;

  return {
    jobs: selected.map(mapBackendJobToUi),
    seeMorePath,
    seeMoreLabel,
  };
}
