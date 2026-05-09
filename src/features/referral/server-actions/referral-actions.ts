"use server";

import { cookies } from "next/headers";
import type { ReferralAsset, GenerateReferralParams, UpdateReferralParams } from "../types";

// ---------------------------------------------------------------------------
// Helpers (mirror cover-letter-actions pattern)
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

const ASSET_TYPE = "referral";

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Fetch all referrals for the current user.
 * GET /api/application-assets/?type=referral
 */
export async function fetchReferrals(): Promise<ReferralAsset[]> {
  const res = await authedFetch(`/api/application-assets/?type=${ASSET_TYPE}`, { method: "GET" });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch referrals");
  }
  const data = (await res.json()) as { assetData?: ReferralAsset[] };
  return data.assetData ?? [];
}

/**
 * Fetch a single referral by id (tries detail endpoint, then list fallback).
 */
export async function fetchReferralById(id: string | number): Promise<ReferralAsset | null> {
  try {
    const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${id}/`, { method: "GET" });
    if (res.ok) {
      const detail = (await res.json()) as ReferralAsset;
      if (detail?.content != null || detail?.id != null) {
        return detail;
      }
    }
  } catch {
    // fall through to list
  }
  const list = await fetchReferrals();
  const asset = list.find(a => String(a.id) === String(id));
  return asset ?? null;
}

/**
 * Fetch referral and poll until content is available (e.g. after async generate).
 */
export async function fetchReferralWithContent(id: string | number, maxRetries = 10, retryDelayMs = 1000): Promise<ReferralAsset | null> {
  let asset = await fetchReferralById(id);
  let retries = 0;
  while (retries < maxRetries && asset && (!asset.content || String(asset.content).trim().length === 0)) {
    await new Promise(r => setTimeout(r, retryDelayMs));
    asset = await fetchReferralById(id);
    retries++;
  }
  return asset;
}

/**
 * Generate a new referral.
 * POST /api/application-assets/generate/
 * Returns { id } on success; throws or returns error shape for 409 / subscription.
 */
export async function generateReferral(
  params: GenerateReferralParams
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
      conname: params.conname,
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
    throw new Error((data as { error?: string })?.error ?? "Failed to generate referral");
  }
  return { id: (data as { id?: string | number })?.id ?? "" };
}

/**
 * Update an existing referral's content.
 * PUT /api/application-assets/referral/{id}/update/
 */
export async function updateReferral(params: UpdateReferralParams): Promise<string> {
  const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${params.id}/update/`, {
    method: "PUT",
    body: JSON.stringify({ content: params.content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to update referral");
  }
  return params.content;
}

/**
 * Delete a referral.
 * DELETE /api/application-assets/referral/{id}/delete/
 */
export async function deleteReferral(id: string | number): Promise<void> {
  const res = await authedFetch(`/api/application-assets/${ASSET_TYPE}/${id}/delete/`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to delete referral");
  }
}
