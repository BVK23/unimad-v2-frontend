"use server";

import type {
  ApplicationAssetApiType,
  ApplicationAssetCheckResult,
  ApplicationAssetCreateOnAcceptResult,
  ApplicationAssetGenerateDraftResult,
  ApplicationAssetStatus,
  CreateApplicationAssetShellParams,
  FetchSelectionSuggestionsParams,
  FetchDocumentImproveSuggestionsParams,
  SelectionSuggestion,
} from "@/features/application-assets/types";
import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse } from "@/utils/message-from-failed-response";

const buildRequestBody = (params: CreateApplicationAssetShellParams): Record<string, string> => {
  const body: Record<string, string> = {
    type: params.type,
    role: params.role,
    company: params.company,
  };
  if (params.job_description) {
    body.job_description = params.job_description;
  }
  if (params.hirname) {
    body.hirname = params.hirname;
  }
  if (params.conname) {
    body.conname = params.conname;
  }
  if (params.application_id != null && params.application_id !== "") {
    body.application_id = String(params.application_id);
  }
  return body;
};

/** Duplicate / validation check only — does not create an asset row. */
export async function checkApplicationAssetAvailability(params: CreateApplicationAssetShellParams): Promise<ApplicationAssetCheckResult> {
  const res = await authedFetch("/api/application-assets/check/", {
    method: "POST",
    body: JSON.stringify(buildRequestBody(params)),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    return {
      error: {
        data: { existing_asset_id: (data as { existing_asset_id?: string })?.existing_asset_id ?? "" },
        message: (data as { message?: string })?.message,
      },
    };
  }
  if (res.status === 403 || (data as { error_code?: string })?.error_code === "NOT_A_PLUS_MEMBER") {
    return { error_code: "NOT_A_PLUS_MEMBER" };
  }
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to check application asset availability");
  }
  return { ok: true };
}

/** First Accept: create asset + content in one step. */
export async function createApplicationAssetOnAccept(
  params: CreateApplicationAssetShellParams & { content: string }
): Promise<ApplicationAssetCreateOnAcceptResult> {
  const body = { ...buildRequestBody(params), content: params.content };
  const res = await authedFetch("/api/application-assets/accept/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    return {
      error: {
        data: { existing_asset_id: (data as { existing_asset_id?: string })?.existing_asset_id ?? "" },
        message: (data as { message?: string })?.message,
      },
    };
  }
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to save application asset");
  }
  return {
    id: (data as { id?: string | number })?.id ?? "",
    application_id: (data as { application_id?: string })?.application_id,
    status: ((data as { status?: ApplicationAssetStatus })?.status ?? "accepted") as ApplicationAssetStatus,
  };
}

/** Subsequent Accept: update existing asset body. */
export async function acceptApplicationAsset(
  assetType: ApplicationAssetApiType,
  assetId: string | number,
  content: string
): Promise<{ status: ApplicationAssetStatus }> {
  const res = await authedFetch(`/api/application-assets/${assetType}/${assetId}/accept/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to accept application asset");
  }
  return { status: ((data as { status?: ApplicationAssetStatus })?.status ?? "accepted") as ApplicationAssetStatus };
}

/** Studio form path: ADK headless (default) or Django Unibot preview-only fallback. */
export async function generateApplicationAssetDraft(
  params: CreateApplicationAssetShellParams
): Promise<ApplicationAssetGenerateDraftResult> {
  const res = await authedFetch("/api/application-assets/generate-draft/", {
    method: "POST",
    body: JSON.stringify(buildRequestBody(params)),
  });
  const rawText = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    // non-JSON body handled below
  }
  if (res.status === 403 || data.error_code === "NOT_A_PLUS_MEMBER") {
    throw new Error("Plus membership required");
  }
  if (!res.ok) {
    const jsonError = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : undefined;
    throw new Error(messageFromFailedResponse(res.status, rawText, jsonError));
  }
  return data as ApplicationAssetGenerateDraftResult;
}

/** Studio selection hover: fetch 2 dynamic improvement suggestions for highlighted text. */
export async function fetchSelectionSuggestions(params: FetchSelectionSuggestionsParams): Promise<{ data: SelectionSuggestion[] }> {
  const res = await authedFetch("/api/application-assets/selection-suggestions/", {
    method: "POST",
    body: JSON.stringify({
      type: params.type,
      selected_text: params.selectedText,
      document_body: params.documentBody ?? "",
      role: params.role ?? "",
      company: params.company ?? "",
      job_description: params.jobDescription ?? "",
      contact_name: params.contactName ?? "",
      asset_id: params.assetId ?? undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch selection suggestions");
  }
  return data as { data: SelectionSuggestion[] };
}

/** Studio Improve footer: fetch 4 dynamic whole-document improvement suggestions. */
export async function fetchDocumentImproveSuggestions(
  params: FetchDocumentImproveSuggestionsParams
): Promise<{ data: SelectionSuggestion[] }> {
  const res = await authedFetch("/api/application-assets/document-improve-suggestions/", {
    method: "POST",
    body: JSON.stringify({
      type: params.type,
      document_body: params.documentBody ?? "",
      role: params.role ?? "",
      company: params.company ?? "",
      job_description: params.jobDescription ?? "",
      contact_name: params.contactName ?? "",
      asset_id: params.assetId ?? undefined,
      exclude_labels: params.excludeLabels ?? [],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch document improve suggestions");
  }
  return data as { data: SelectionSuggestion[] };
}
