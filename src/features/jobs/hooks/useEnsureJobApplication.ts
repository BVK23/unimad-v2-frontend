"use client";

import { useCallback, useRef } from "react";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import { createApplication } from "@/features/application-tracker/server-actions/application-actions";
import type { Application } from "@/features/application-tracker/types";
import type { Job } from "@/types/jobs";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Resolves a tracker or discovery job to a backend application_id,
 * creating a draft application when needed (e.g. job board jobs).
 */
export function useEnsureJobApplication() {
  const queryClient = useQueryClient();
  const { data: applications = [] } = useApplications();
  const resolvedRef = useRef<string | null>(null);

  const ensureApplication = useCallback(
    async (job: Job): Promise<string> => {
      if (resolvedRef.current) return resolvedRef.current;

      const byAppId = applications.find((a: Application) => a.application_id === job.id);
      if (byAppId) {
        resolvedRef.current = byAppId.application_id;
        return byAppId.application_id;
      }

      const byJobId = applications.find((a: Application) => a.job_id && String(a.job_id) === String(job.id));
      if (byJobId) {
        resolvedRef.current = byJobId.application_id;
        return byJobId.application_id;
      }

      const created = await createApplication({
        role: job.role,
        company: job.company,
        job_description: job.description?.trim() || `${job.role} at ${job.company}`,
        status: "draft",
        job_id: job.id,
      });

      resolvedRef.current = created.application_id;
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      return created.application_id;
    },
    [applications, queryClient]
  );

  const resetResolved = useCallback(() => {
    resolvedRef.current = null;
  }, []);

  return { ensureApplication, resetResolved };
}
