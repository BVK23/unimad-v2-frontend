"use server";

import { messageFromFailedResponse } from "@/utils/message-from-failed-response";
import { cookies } from "next/headers";
import type { MediaItem, ProfileData, SubscriptionData } from "../types";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  return url.replace(/\/+$/, "");
}

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

function authScheme(token: string): "Bearer" | "Token" {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(token.trim()) ? "Bearer" : "Token";
}

async function authedJsonFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${authScheme(token)} ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
}

async function errorFromResponse(res: Response, fallback: string): Promise<string> {
  const bodyText = await res.text();
  let jsonError: string | undefined;
  try {
    jsonError = (JSON.parse(bodyText) as { error?: string })?.error;
  } catch {
    // body is not JSON
  }
  return messageFromFailedResponse(res.status, bodyText, jsonError ?? fallback);
}

function normalizeOptionalUrl(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeProfileUpdatePayload(payload: Partial<ProfileData>): Partial<ProfileData> {
  const next: Partial<ProfileData> = { ...payload };
  if ("linkedin_url" in payload) {
    next.linkedin_url = normalizeOptionalUrl(payload.linkedin_url);
  }
  if ("portfolio_url" in payload) {
    next.portfolio_url = normalizeOptionalUrl(payload.portfolio_url);
  }
  if ("github_url" in payload) {
    next.github_url = normalizeOptionalUrl(payload.github_url);
  }
  return next;
}

export async function fetchProfileData(): Promise<ProfileData> {
  const res = await authedJsonFetch("/api/profile-data/", { method: "GET" });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch profile"));
  }
  return (await res.json()) as ProfileData;
}

export async function updateProfileData(payload: Partial<ProfileData>): Promise<void> {
  const data = normalizeProfileUpdatePayload(payload);
  const res = await authedJsonFetch("/api/profile-update/", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to update profile"));
  }
}

export async function fetchProfileMedia(category: string): Promise<MediaItem[]> {
  const res = await authedJsonFetch(`/api/media-data/?category=${encodeURIComponent(category)}`, { method: "GET" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch media"));
  }
  const data = (await res.json()) as { media?: MediaItem[] };
  return (data.media ?? []) as MediaItem[];
}

export async function uploadProfileMedia(formData: FormData): Promise<{ url: string; blob_name: string }> {
  const token = await getAuthToken();
  const res = await fetch(`${getBackendUrl()}/api/media-upload/`, {
    method: "POST",
    headers: { Authorization: `${authScheme(token)} ${token}` },
    body: formData,
    cache: "no-store",
  });
  const bodyText = await res.text();
  if (!res.ok) {
    let jsonError: string | undefined;
    try {
      jsonError = (JSON.parse(bodyText) as { error?: string })?.error;
    } catch {
      // body is not JSON
    }
    throw new Error(messageFromFailedResponse(res.status, bodyText, jsonError ?? "Failed to upload media"));
  }
  let data: { content?: { url?: string; blob_name?: string } };
  try {
    data = JSON.parse(bodyText) as { content?: { url?: string; blob_name?: string } };
  } catch {
    throw new Error("Invalid upload response");
  }
  const content = data.content;
  if (!content?.url) throw new Error("Invalid upload response");
  return { url: content.url, blob_name: content.blob_name ?? "" };
}

export async function clearProfileKnowledgeData(target: string): Promise<void> {
  const res = await authedJsonFetch("/api/profile-clear-data/", {
    method: "POST",
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to clear data"));
  }
}

export async function fetchSubscriptionData(): Promise<SubscriptionData> {
  const res = await authedJsonFetch("/api/user-subscription-data/", { method: "GET" });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch subscription"));
  }
  return (await res.json()) as SubscriptionData;
}
