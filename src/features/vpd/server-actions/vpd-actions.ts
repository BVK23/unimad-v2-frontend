"use server";

import { authedFetch } from "@/lib/authed-fetch";
import type { GenerateVpdParams, GenerateVpdResult, VpdApiData, VpdLandingData } from "../types";
import type { VpdUpdateContent } from "../utils/mapStudioProjectToVpdUpdatePayload";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

function getPublicAssetAuthSecret(): string {
  const secret = process.env.UNIMAD_PUBLIC_ASSET_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "UNIMAD_PUBLIC_ASSET_SECRET or JWT_SECRET is not defined. Set one to match the backend SECRET_KEY for public VPD URLs."
    );
  }
  return secret;
}

/**
 * Fetch VPD library (user docs + legacy templates).
 * GET /api/vpd/landing/
 */
export async function fetchVpdLanding(): Promise<VpdLandingData> {
  const res = await authedFetch("/api/vpd/landing/", { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    userVpds?: VpdApiData[];
    vpdTemplates?: unknown[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch VPD library");
  }
  return {
    userVpds: Array.isArray(data.userVpds) ? data.userVpds : [],
    vpdTemplates: Array.isArray(data.vpdTemplates) ? data.vpdTemplates : [],
  };
}

/**
 * Generate a VPD.
 * POST /api/vpd/generate/
 * Pass schemaVersion: 2 for portfolio-grid editor_content (Studio).
 */
export async function generateVpd(params: GenerateVpdParams = {}): Promise<GenerateVpdResult> {
  const schemaVersion = params.schemaVersion ?? 2;
  const body: Record<string, unknown> = {
    schemaVersion,
  };
  if (params.application_id) {
    body.application_id = params.application_id;
  } else {
    if (params.role) body.role = params.role;
    if (params.company) body.company = params.company;
    if (params.jobDescription) body.jobDescription = params.jobDescription;
  }

  const res = await authedFetch("/api/vpd/generate/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.status === 409) {
    return {
      duplicate: true,
      existing_vpd_id: String(data.vpd_id ?? ""),
      application_id: data.application_id ? String(data.application_id) : undefined,
      message: typeof data.message === "string" ? data.message : "VPD already exists",
    };
  }

  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Failed to generate VPD");
  }

  return {
    id: String(data.id ?? ""),
    vpdData: (data.vpdData as VpdApiData) ?? {
      id: String(data.id ?? ""),
      title: "",
      editor_content: { schemaVersion: 2, items: [] },
    },
    application_id: data.application_id ? String(data.application_id) : undefined,
    is_new_application: Boolean(data.is_new_application),
    message: typeof data.message === "string" ? data.message : undefined,
  };
}

/**
 * Fetch a single VPD by id.
 * GET /api/vpd/content/?id=
 */
export async function fetchVpdContent(vpdId: string): Promise<VpdApiData> {
  const res = await authedFetch(`/api/vpd/content/?id=${encodeURIComponent(vpdId)}`, {
    method: "GET",
  });
  const data = (await res.json().catch(() => ({}))) as {
    vpdData?: VpdApiData;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch VPD content");
  }
  if (!data.vpdData) {
    throw new Error("VPD not found");
  }
  return data.vpdData;
}

/**
 * Delete a VPD by id.
 * POST /api/vpd/delete/
 */
export async function deleteVpd(vpdId: string): Promise<void> {
  const res = await authedFetch("/api/vpd/delete/", {
    method: "POST",
    body: JSON.stringify({ id: vpdId }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to delete VPD");
  }
}

/**
 * Persist VPD title / cover / editor_content.
 * POST /api/vpd/update/
 */
export async function updateVpdContent(vpdId: string, content: VpdUpdateContent): Promise<VpdApiData> {
  const res = await authedFetch("/api/vpd/update/", {
    method: "POST",
    body: JSON.stringify({
      id: vpdId,
      content,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    asset_data?: VpdApiData;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to update VPD");
  }
  if (!data.asset_data) {
    throw new Error("VPD update returned no data");
  }
  return data.asset_data;
}

export type PublishVpdResult = { ok: true; slug: string } | { ok: false; error: string; error_code?: string };

/**
 * Publish (or re-publish) a VPD under a public slug.
 * POST /api/publish-asset/ with assetType: "vpd"
 * Backend rejects taken slugs with 400 + "This URL is already taken..."
 */
export async function publishVpdAsset(content: Record<string, unknown>, slug: string): Promise<PublishVpdResult> {
  const trimmed = typeof slug === "string" ? slug.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Please enter a link name" };
  }

  const res = await authedFetch("/api/publish-asset/", {
    method: "POST",
    body: JSON.stringify({
      assetType: "vpd",
      content,
      slug: trimmed,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { slug?: string; error?: string; error_code?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Failed to publish VPD",
      error_code: data?.error_code,
    };
  }

  return { ok: true, slug: data.slug ?? trimmed };
}

export type FetchPublicVpdResult = { ok: true; assetData: VpdApiData } | { ok: false; error: string; status: number };

/**
 * Load a published VPD by public slug (server-side / public page).
 * GET /api/public-asset-data/?assetType=vpd&slug=
 */
export async function fetchPublicVpdBySlug(vpdSlug: string): Promise<FetchPublicVpdResult> {
  const backendUrl = getBackendUrl();
  const secret = getPublicAssetAuthSecret();
  const url = `${backendUrl}/api/public-asset-data/?assetType=${encodeURIComponent("vpd")}&slug=${encodeURIComponent(vpdSlug)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Unimad-Auth": secret,
    },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { assetData?: VpdApiData; error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Could not load this public VPD",
      status: res.status,
    };
  }

  if (!data.assetData || typeof data.assetData !== "object") {
    return { ok: false, error: "No VPD data was returned", status: 404 };
  }

  return { ok: true, assetData: data.assetData };
}
