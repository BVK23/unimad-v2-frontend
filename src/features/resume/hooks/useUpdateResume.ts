import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResumeData } from "../../../../types";
import { mapBackendResumeToFrontend } from "../api/mappers";
import { mapFrontendResumeToBackend } from "../api/mappers";
import { createResume, updateResumeContent } from "../server-actions/resume-actions";

export type SaveResumeResult = { created: boolean; id: string; resume_data: Record<string, unknown> };

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resumeId, data }: { resumeId: string; data: ResumeData }): Promise<SaveResumeResult> => {
      const backendPayload = mapFrontendResumeToBackend(data);
      const isNew = !resumeId || resumeId.trim() === "";

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

      queryClient.setQueryData(["resumes", result.id], resumeWithId);

      const hasListCache = queryClient.getQueryState(["resumes"]);
      queryClient.setQueryData<ResumeData[]>(["resumes"], current => {
        if (!current || !Array.isArray(current)) {
          return current;
        }

        const index = current.findIndex(item => item.id === result.id);
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

      if (result.created && !hasListCache) {
        queryClient.invalidateQueries({ queryKey: ["resumes"] });
      }
    },
  });
}
