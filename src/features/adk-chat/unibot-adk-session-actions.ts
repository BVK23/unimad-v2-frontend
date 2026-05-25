"use server";

import { cookies } from "next/headers";
import type { UnibotAdkSessionRow } from "./session-registry";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuthHeader(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) throw new Error("Unauthorized");
  const scheme = looksLikeJwt(token) ? "Bearer" : "Token";
  return `${scheme} ${token}`;
}

async function authedJson<T>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const auth = await getAuthHeader();
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function listUnibotAdkSessionsAction(): Promise<{
  success: boolean;
  sessions: UnibotAdkSessionRow[];
  error?: string;
}> {
  try {
    const { ok, data } = await authedJson<{ sessions?: UnibotAdkSessionRow[]; error?: string }>("/api/unibot-adk-sessions/", {
      method: "GET",
    });
    if (!ok) {
      return { success: false, sessions: [], error: data.error ?? "Failed to load session registry" };
    }
    return { success: true, sessions: Array.isArray(data.sessions) ? data.sessions : [] };
  } catch (err) {
    return {
      success: false,
      sessions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function registerUnibotAdkSessionAction(body: Record<string, unknown>): Promise<{
  success: boolean;
  session?: UnibotAdkSessionRow;
  reused?: boolean;
  created?: boolean;
  needs_adk_session?: boolean;
  suggested_title?: string;
  error?: string;
}> {
  try {
    const { ok, data } = await authedJson<{
      session?: UnibotAdkSessionRow;
      reused?: boolean;
      created?: boolean;
      needs_adk_session?: boolean;
      suggested_title?: string;
      error?: string;
    }>("/api/unibot-adk-sessions/register/", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!ok) {
      return { success: false, error: data.error ?? "Register failed" };
    }
    return {
      success: true,
      session: data.session,
      reused: data.reused,
      created: data.created,
      needs_adk_session: data.needs_adk_session,
      suggested_title: data.suggested_title,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteUnibotAdkSessionRegistryAction(adkSessionId: string): Promise<{
  success: boolean;
  adk_session_ids_to_delete: string[];
  error?: string;
}> {
  try {
    const { ok, data } = await authedJson<{
      success?: boolean;
      adk_session_ids_to_delete?: string[];
      error?: string;
    }>("/api/unibot-adk-sessions/delete/", {
      method: "POST",
      body: JSON.stringify({ adk_session_id: adkSessionId }),
    });
    if (!ok) {
      return {
        success: false,
        adk_session_ids_to_delete: [adkSessionId],
        error: data.error ?? "Registry delete failed",
      };
    }
    return {
      success: true,
      adk_session_ids_to_delete: data.adk_session_ids_to_delete ?? [adkSessionId],
    };
  } catch (err) {
    return {
      success: false,
      adk_session_ids_to_delete: [adkSessionId],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
