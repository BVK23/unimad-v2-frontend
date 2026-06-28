"use client";

import { useCallback, useMemo } from "react";
import { getLinkedAssetId, parseApplicationAssets, type ApplicationAssets } from "@/features/application-tracker/application-assets";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import type { Application } from "@/features/application-tracker/types";
import { COLD_EMAIL_LIST_QUERY_KEY } from "@/features/cold-email/hooks/useColdEmailHistory";
import { COVER_LETTER_LIST_QUERY_KEY } from "@/features/cover-letter/hooks/useCoverLetterHistory";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import type { Job } from "@/types/jobs";
import { useQueryClient } from "@tanstack/react-query";
import { useEnsureJobApplication } from "./useEnsureJobApplication";

function findApplicationForJob(applications: Application[], job: Job): Application | undefined {
  return (
    applications.find(a => a.application_id === job.id) ?? applications.find(a => a.job_id != null && String(a.job_id) === String(job.id))
  );
}

export function usePrepareApplicationContext(job: Job) {
  const queryClient = useQueryClient();
  const { data: applications = [], refetch, isFetching } = useApplications();
  const { ensureApplication, resetResolved } = useEnsureJobApplication();

  const application = useMemo(() => findApplicationForJob(applications, job), [applications, job]);

  const applicationId = application?.application_id ?? null;
  const assets = useMemo(() => parseApplicationAssets(application?.assets), [application?.assets]);

  const linkedResumeId = getLinkedAssetId(assets, "resume");
  const linkedCoverLetterId = getLinkedAssetId(assets, "cover-letter");
  const linkedColdEmailId = getLinkedAssetId(assets, "cold-email");

  const syncApplicationAssets = useCallback(async (): Promise<{
    application: Application | undefined;
    assets: ApplicationAssets;
  }> => {
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
    const result = await refetch();
    const list = result.data ?? [];
    const app = findApplicationForJob(list, job);
    return { application: app, assets: parseApplicationAssets(app?.assets) };
  }, [queryClient, refetch, job]);

  const resolveApplicationId = useCallback(async (): Promise<string> => {
    const id = await ensureApplication(job);
    await syncApplicationAssets();
    return id;
  }, [ensureApplication, job, syncApplicationAssets]);

  const invalidateResumeCaches = useCallback(
    async (resumeId?: string) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      if (resumeId) {
        await queryClient.invalidateQueries({ queryKey: resumeByIdQueryKey(resumeId) });
      }
    },
    [queryClient]
  );

  const invalidateTextAssetCaches = useCallback(
    async (opts?: { coverLetterId?: string | null; coldEmailId?: string | null }) => {
      await queryClient.invalidateQueries({ queryKey: COVER_LETTER_LIST_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: COLD_EMAIL_LIST_QUERY_KEY });
      if (opts?.coverLetterId) {
        await queryClient.invalidateQueries({ queryKey: ["cover-letter", opts.coverLetterId] });
      }
      if (opts?.coldEmailId) {
        await queryClient.invalidateQueries({ queryKey: ["cold-email", opts.coldEmailId] });
      }
    },
    [queryClient]
  );

  return {
    application,
    applicationId,
    assets,
    linkedResumeId,
    linkedCoverLetterId,
    linkedColdEmailId,
    isFetchingApplications: isFetching,
    syncApplicationAssets,
    resolveApplicationId,
    invalidateResumeCaches,
    invalidateTextAssetCaches,
    resetResolved,
  };
}
