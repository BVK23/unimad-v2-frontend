import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResumeData } from "../../../../types";
import { mapBackendResumeToFrontend } from "../api/mappers";
import { mapFrontendResumeToBackend } from "../api/mappers";
import { isPersistedResumeId } from "../constants/resumeDraft";
import { createResume, updateResumeContent } from "../server-actions/resume-actions";
import { resumeByIdQueryKey } from "./useResume";
import { resumesListQueryKey } from "./useResumesList";

export type SaveResumeResult = { created: boolean; id: string; resume_data: Record<string, unknown> };

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeId, data }: { resumeId: string; data: ResumeData }): Promise<SaveResumeResult> => {
      const backendPayload = mapFrontendResumeToBackend(data);
      const isNew = !isPersistedResumeId(resumeId);

      if (isNew) {
        const response = await createResume(backendPayload);
        return {
          created: true,
          id: response.id,
          resume_data: response.resume_data,
        };
      }

      const response = await updateResumeContent(resumeId, backendPayload);
      return {
        created: false,
        id: resumeId,
        resume_data: response.resume_data,
      };
    },
    onSuccess: (result, variables) => {
      const resumeWithId: ResumeData = result.created
        ? {
            ...mapBackendResumeToFrontend(result.resume_data),
            id: result.id,
          }
        : {
            ...variables.data,
            id: result.id,
          };

      queryClient.setQueryData(resumeByIdQueryKey(result.id), resumeWithId);

      queryClient.setQueriesData<ResumeData[]>({ queryKey: resumesListQueryKey }, current => {
        if (!current || !Array.isArray(current)) {
          return current;
        }

        const index = current.findIndex(item => String(item.id) === String(result.id));
        if (index === -1) {
          return result.created ? [resumeWithId, ...current] : current;
        }

        const next = [...current];
        next[index] = {
          ...next[index],
          ...resumeWithId,
        };
        return next;
      });

      if (result.created) {
        void queryClient.invalidateQueries({ queryKey: resumesListQueryKey });
      }
    },
  });
}
