"use server";

import { getAuthHeaders, getEndpointForPath } from "@/features/adk-chat/config";
import type { ApplicationAssetApiType, ApplicationAssetGenerateDraftResult } from "@/features/application-assets/types";
import type { ApplicationAssetProfileSnapshot } from "@/features/application-assets/utils/applicationAssetProfileSnapshot";
import { formatCoverLetterDate } from "@/features/application-assets/utils/formatCoverLetterDate";
import { messageFromFailedResponse } from "@/utils/message-from-failed-response";

const ADK_KEY_HEADER = "X-Unimad-Adk-Key";

export type GenerateStudioDraftActionParams = {
  type: ApplicationAssetApiType;
  role: string;
  company: string;
  jobDescription: string;
  contactName?: string;
  profileSnapshot: ApplicationAssetProfileSnapshot;
};

export type GenerateStudioDraftActionResult =
  | { success: true; data: ApplicationAssetGenerateDraftResult }
  | { success: false; error: string };

export const generateStudioDraftAction = async (params: GenerateStudioDraftActionParams): Promise<GenerateStudioDraftActionResult> => {
  const adkKey = process.env.ADK_INTERNAL_API_KEY?.trim();
  if (!adkKey) {
    return { success: false, error: "ADK internal API key is not configured on the server." };
  }

  const url = getEndpointForPath("/studio/generate-draft");
  const authHeaders = await getAuthHeaders();

  const body = {
    type: params.type,
    role: params.role.trim(),
    company: params.company.trim(),
    job_description: params.jobDescription.trim(),
    contact_name: params.contactName?.trim() ?? "",
    profile_snapshot: params.profileSnapshot,
    ...(params.type === "coverletter" ? { current_date: formatCoverLetterDate() } : {}),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders,
        [ADK_KEY_HEADER]: adkKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let jsonError: string | undefined;
      try {
        const parsed = JSON.parse(bodyText) as { detail?: string; error?: string };
        jsonError = parsed.detail ?? parsed.error;
      } catch {
        /* not json */
      }
      const message = messageFromFailedResponse(response.status, bodyText, jsonError ?? "Could not generate your draft. Please try again.");
      return { success: false, error: message };
    }

    const data = (await response.json()) as ApplicationAssetGenerateDraftResult;
    if (!data.content?.trim()) {
      return { success: false, error: "Could not read the generated draft. Please try again." };
    }

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate your draft. Please try again.";
    return { success: false, error: message };
  }
};
