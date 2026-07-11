"use client";

import { runPrepareApplicationAssetDraft } from "@/features/application-assets/api/runPrepareApplicationAssetDraft";
import { checkApplicationAssetAvailability } from "@/features/application-assets/server-actions/application-asset-actions";
import { generateResume } from "@/features/resume/server-actions/resume-actions";
import type { Job } from "@/types/jobs";
import { sanitizeUserFacingError } from "@/utils/message-from-failed-response";
import { useMutation } from "@tanstack/react-query";

export type GeneratablePrepareTab = "resume" | "cover-letter" | "cold-email";

type TabPatch = {
  assetId?: string | null;
  content?: string;
  error?: string | null;
  status?: "idle" | "ready" | "error";
};

type UsePrepareApplicationAssetMutationsOptions = {
  job: Job;
  ensureApplicationId: () => Promise<string>;
  applySyncedAsset: (tab: GeneratablePrepareTab, fallbackId?: string) => Promise<void>;
  syncApplicationAssets: () => Promise<unknown>;
  onTabPatch: (tab: GeneratablePrepareTab, patch: TabPatch) => void;
};

async function generatePrepareTabAsset(
  tab: GeneratablePrepareTab,
  job: Job,
  applicationId: string,
  applySyncedAsset: (tab: GeneratablePrepareTab, fallbackId?: string) => Promise<void>,
  syncApplicationAssets: () => Promise<unknown>
): Promise<TabPatch> {
  const jd = job.description?.trim() || `${job.role} at ${job.company}`;
  const baseParams = {
    role: job.role,
    company: job.company,
    job_description: jd,
    application_id: applicationId,
  };

  if (tab === "resume") {
    const result = await generateResume({
      application_id: applicationId,
      company: job.company,
      role: job.role,
      jd,
    });

    if (!result.ok) {
      const existingId = result.duplicate?.resume_id;
      if (existingId) {
        await applySyncedAsset(tab, String(existingId));
        return { status: "ready", error: null };
      }
      return {
        status: "error",
        error: result.message,
      };
    }

    await applySyncedAsset(tab, result.id);
    return { status: "ready", error: null };
  }

  const assetType = tab === "cover-letter" ? "coverletter" : "coldemail";
  const availability = await checkApplicationAssetAvailability({
    type: assetType,
    ...baseParams,
  });

  if ("error_code" in availability) {
    throw new Error(
      tab === "cover-letter" ? "Plus membership required to generate cover letters" : "Plus membership required to generate cold emails"
    );
  }

  if ("error" in availability) {
    await applySyncedAsset(tab, String(availability.error.data.existing_asset_id));
    return { status: "ready", error: null };
  }

  const genResult = await runPrepareApplicationAssetDraft({
    assetType,
    role: job.role,
    company: job.company,
    jobDescription: jd,
    applicationId,
  });

  await syncApplicationAssets();
  await applySyncedAsset(tab, genResult.assetId);

  return {
    status: "ready",
    assetId: genResult.assetId,
    content: genResult.draft,
    error: null,
  };
}

function usePrepareTabMutation(
  tab: GeneratablePrepareTab,
  { job, ensureApplicationId, applySyncedAsset, syncApplicationAssets, onTabPatch }: UsePrepareApplicationAssetMutationsOptions
) {
  return useMutation({
    mutationKey: ["prepare-application", job.id, tab],
    mutationFn: async () => {
      const applicationId = await ensureApplicationId();
      return generatePrepareTabAsset(tab, job, applicationId, applySyncedAsset, syncApplicationAssets);
    },
    onMutate: () => {
      onTabPatch(tab, { error: null });
    },
    onSuccess: patch => {
      onTabPatch(tab, patch);
    },
    onError: error => {
      onTabPatch(tab, {
        status: "error",
        error: sanitizeUserFacingError(
          error instanceof Error ? error.message : "Generation failed",
          "Generation failed. Please try again."
        ),
      });
    },
  });
}

/** Per-tab React Query mutations so loading state stays isolated when switching Prepare Application tabs. */
export function usePrepareApplicationAssetMutations(options: UsePrepareApplicationAssetMutationsOptions) {
  const resume = usePrepareTabMutation("resume", options);
  const coverLetter = usePrepareTabMutation("cover-letter", options);
  const coldEmail = usePrepareTabMutation("cold-email", options);

  const byTab: Record<GeneratablePrepareTab, typeof resume> = {
    resume,
    "cover-letter": coverLetter,
    "cold-email": coldEmail,
  };

  const isTabPending = (tab: GeneratablePrepareTab) => byTab[tab].isPending;

  const generateTab = (tab: GeneratablePrepareTab) => {
    void byTab[tab].mutate();
  };

  return {
    byTab,
    isTabPending,
    generateTab,
  };
}
