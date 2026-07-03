"use server";

import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse } from "@/utils/message-from-failed-response";
import type { MediaItem, ProfileData, SubscriptionData } from "../types";

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
  const res = await authedFetch("/api/profile-data/", { method: "GET" });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch profile"));
  }
  return (await res.json()) as ProfileData;
}

export async function updateProfileData(payload: Partial<ProfileData>): Promise<void> {
  const data = normalizeProfileUpdatePayload(payload);
  const res = await authedFetch("/api/profile-update/", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to update profile"));
  }
}

export async function fetchProfileMedia(category: string): Promise<MediaItem[]> {
  const res = await authedFetch(`/api/media-data/?category=${encodeURIComponent(category)}`, { method: "GET" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch media"));
  }
  const data = (await res.json()) as { media?: MediaItem[] };
  return (data.media ?? []) as MediaItem[];
}

export async function uploadProfileMedia(formData: FormData): Promise<{ url: string; blob_name: string }> {
  const res = await authedFetch("/api/media-upload/", {
    method: "POST",
    body: formData,
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
  const res = await authedFetch("/api/profile-clear-data/", {
    method: "POST",
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to clear data"));
  }
}

export async function fetchSubscriptionData(): Promise<SubscriptionData> {
  const res = await authedFetch("/api/user-subscription-data/", { method: "GET" });
  if (!res.ok) {
    throw new Error(await errorFromResponse(res, "Failed to fetch subscription"));
  }
  return (await res.json()) as SubscriptionData;
}
