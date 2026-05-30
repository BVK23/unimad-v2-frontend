"use server";

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

export async function fetchProfileData(): Promise<ProfileData> {
  const res = await authedJsonFetch("/api/profile-data/", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch profile");
  }
  return data as ProfileData;
}

export async function updateProfileData(payload: Partial<ProfileData>): Promise<void> {
  const res = await authedJsonFetch("/api/profile-update/", {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to update profile");
  }
}

export async function fetchProfileMedia(category: string): Promise<MediaItem[]> {
  const res = await authedJsonFetch(`/api/media-data/?category=${encodeURIComponent(category)}`, { method: "GET" });
  if (res.status === 404) return [];
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch media");
  }
  return ((data as { media?: MediaItem[] }).media ?? []) as MediaItem[];
}

export async function uploadProfileMedia(formData: FormData): Promise<{ url: string; blob_name: string }> {
  const token = await getAuthToken();
  const res = await fetch(`${getBackendUrl()}/api/media-upload/`, {
    method: "POST",
    headers: { Authorization: `${authScheme(token)} ${token}` },
    body: formData,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to upload media");
  }
  const content = (data as { content?: { url?: string; blob_name?: string } }).content;
  if (!content?.url) throw new Error("Invalid upload response");
  return { url: content.url, blob_name: content.blob_name ?? "" };
}

export async function clearProfileKnowledgeData(target: string): Promise<void> {
  const res = await authedJsonFetch("/api/profile-clear-data/", {
    method: "POST",
    body: JSON.stringify({ target }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Failed to clear data");
  }
}

export async function fetchSubscriptionData(): Promise<SubscriptionData> {
  const res = await authedJsonFetch("/api/user-subscription-data/", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch subscription");
  }
  return data as SubscriptionData;
}
