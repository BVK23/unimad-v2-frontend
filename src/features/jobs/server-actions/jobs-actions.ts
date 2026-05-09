"use server";

import { cookies } from "next/headers";
import type { BackendJob, JobListResponse, JobSearchParams } from "../types";

// -----------------------------------------------------------------------------
// Shared helpers (mirrors resume server-actions pattern)
// -----------------------------------------------------------------------------

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

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// -----------------------------------------------------------------------------
// Server actions
// -----------------------------------------------------------------------------

export async function getJobs(params: JobSearchParams = {}): Promise<JobListResponse> {
  const queryString = buildQueryString(params as Record<string, unknown>);
  const res = await authedFetch(`/api/jobs/${queryString}`, {
    method: "GET",
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON from /api/jobs/ but got ${contentType || "unknown"}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as JobListResponse;

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch jobs");
  }

  return data;
}

export async function getJob(id: string): Promise<BackendJob | null> {
  const res = await authedFetch(`/api/jobs/${encodeURIComponent(id)}/`, {
    method: "GET",
  });

  if (res.status === 404) return null;
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch job");
  }

  return (await res.json()) as BackendJob;
}

export async function recordJobViewed(id?: string | null): Promise<{ recorded?: boolean } | void> {
  if (!id) return;

  const res = await authedFetch(`/api/jobs/${encodeURIComponent(id)}/view/`, {
    method: "POST",
  });

  if (res.ok) {
    return res.json().catch(() => ({}));
  }

  // Silently ignore 404s or minor errors – analytics only
  if (res.status !== 404) {
    const data = await res.json().catch(() => ({}));

    console.warn("recordJobViewed failed:", (data as { error?: string })?.error ?? res.status);
  }
}

export async function saveJob(id: string): Promise<{ success?: boolean }> {
  const res = await authedFetch(`/api/jobs/${encodeURIComponent(id)}/save/`, {
    method: "POST",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to save job");
  }

  return data as { success?: boolean };
}

export async function unsaveJob(id: string): Promise<{ success?: boolean }> {
  const res = await authedFetch(`/api/jobs/${encodeURIComponent(id)}/save/`, {
    method: "DELETE",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to unsave job");
  }

  return data as { success?: boolean };
}

export async function getSavedJobs(page = 1): Promise<JobListResponse> {
  const res = await authedFetch(`/api/jobs/saved/?page=${encodeURIComponent(page)}`, {
    method: "GET",
  });

  if (res.status === 404) {
    return {
      jobs: [],
      pagination: { total_count: 0, page: 1, page_size: 10, has_next: false },
    };
  }

  const data = (await res.json()) as JobListResponse;

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch saved jobs");
  }

  return data;
}

export async function getRecentJobs(limit = 10): Promise<JobListResponse> {
  const res = await authedFetch(`/api/jobs/recent/?limit=${encodeURIComponent(limit)}`, {
    method: "GET",
  });

  if (res.status === 404) {
    return {
      jobs: [],
      pagination: { total_count: 0, page: 1, page_size: limit, has_next: false },
    };
  }

  const data = (await res.json()) as JobListResponse;

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch recent jobs");
  }

  return data;
}
