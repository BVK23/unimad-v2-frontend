"use server";

import { normalizeContactNameForDisplay } from "@/utils/normalizeContactName";
import { cookies } from "next/headers";
import type { ColdEmailAsset, GenerateColdEmailParams, UpdateColdEmailParams } from "../types";

// ---------------------------------------------------------------------------
// Helpers (mirror resume-actions pattern)
// ---------------------------------------------------------------------------

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) {
    throw new Error("Unauthorized");
  }
  const scheme: AuthResult["scheme"] = looksLikeJwt(cookieToken) ? "Bearer" : "Token";
  return { token: cookieToken, scheme };
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();
  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
}

const ASSET_TYPE = "coldemail";

const normalizeColdEmailAsset = (asset: ColdEmailAsset & { contact_name?: string }): ColdEmailAsset => ({
  ...asset,
  job_description: (asset.job_description ?? asset.jd ?? "").trim() || undefined,
  hirname: normalizeContactNameForDisplay(asset.hirname ?? asset.managerName ?? asset.contact_name),
});

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Fetch all cold emails for the current user.
 * GET /api/application-assets/?type=coldemail
 */
export async function fetchColdEmails(): Promise<ColdEmailAsset[]> {
  const res = await authedFetch(`/api/application-assets/?type=${ASSET_TYPE}`, { method: "GET" });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch cold emails");
  }
  const data = (await res.json()) as { assetData?: ColdEmailAsset[] };
  return (data.assetData ?? []).map(normalizeColdEmailAsset);
}

/**
 * Fetch a single cold email by id (tries detail endpoint, then list fallback).
 */
export async function fetchColdEmailById(id: string | number): Promise<ColdEmailAsset | null> {
  try {
    const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${id}/`, { method: "GET" });
    if (res.ok) {
      const detail = (await res.json()) as ColdEmailAsset;
      if (detail?.content != null || detail?.id != null) {
        return normalizeColdEmailAsset(detail);
      }
    }
  } catch {
    // fall through to list
  }
  const list = await fetchColdEmails();
  const asset = list.find(a => String(a.id) === String(id));
  return asset ?? null;
}

/**
 * Fetch cold email and poll until content is available (e.g. after async generate).
 */
export async function fetchColdEmailWithContent(id: string | number, maxRetries = 10, retryDelayMs = 1000): Promise<ColdEmailAsset | null> {
  let asset = await fetchColdEmailById(id);
  let retries = 0;
  while (retries < maxRetries && asset && (!asset.content || String(asset.content).trim().length === 0)) {
    await new Promise(r => setTimeout(r, retryDelayMs));
    asset = await fetchColdEmailById(id);
    retries++;
  }
  return asset;
}

/**
 * Generate a new cold email.
 * POST /api/application-assets/generate/
 * Returns { id } on success; throws or returns error shape for 409 / subscription.
 */
export async function generateColdEmail(
  params: GenerateColdEmailParams
): Promise<
  | { id: string | number }
  | { error: { data: { existing_asset_id: string | number }; message?: string } }
  | { error_code: "NOT_A_PLUS_MEMBER" }
> {
  const res = await authedFetch("/api/application-assets/generate/", {
    method: "POST",
    body: JSON.stringify({
      type: ASSET_TYPE,
      role: params.role,
      company: params.company,
      job_description: params.job_description,
      hirname: params.hirname,
      ...(params.application_id && { application_id: params.application_id }),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    return {
      error: {
        data: {
          existing_asset_id: (data as { existing_asset_id?: string })?.existing_asset_id ?? "",
        },
        message: (data as { message?: string })?.message,
      },
    };
  }
  if (res.status === 403 || (data as { error_code?: string })?.error_code === "NOT_A_PLUS_MEMBER") {
    return { error_code: "NOT_A_PLUS_MEMBER" };
  }
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to generate cold email");
  }
  return { id: (data as { id?: string | number })?.id ?? "" };
}

/**
 * Update an existing cold email's content.
 * PUT /api/application-assets/coldemail/{id}/update/
 */
export async function updateColdEmail(params: UpdateColdEmailParams): Promise<string> {
  const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${params.id}/update/`, {
    method: "PUT",
    body: JSON.stringify({ content: params.content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to update cold email");
  }
  return params.content;
}

/**
 * Delete a cold email.
 * DELETE /api/application-assets/coldemail/{id}/delete/
 */
export async function deleteColdEmail(id: string | number): Promise<void> {
  const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${id}/delete/`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to delete cold email");
  }
}
