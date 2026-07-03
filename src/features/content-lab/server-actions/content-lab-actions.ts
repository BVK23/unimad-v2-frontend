"use server";

import type { ContentGenAssetItem, UnibotChatMessage } from "@/features/content-lab/types";
import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse, sanitizeUserFacingError } from "@/utils/message-from-failed-response";

export type ContentGenMutationResult = { success: true } | { success: false; error: string };

export type ProfileRolesResult = {
  roles: string[];
};

/**
 * GET `/api/profile-data/` — desired roles for Content Gen ADK session state.
 */
export async function fetchProfileRoles(): Promise<ProfileRolesResult> {
  const res = await authedFetch(`/api/profile-data/`, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as { role?: string[] | string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load profile");
  }

  const raw = data.role;
  if (Array.isArray(raw)) {
    return { roles: raw.map(r => String(r).trim()).filter(Boolean) };
  }
  if (typeof raw === "string" && raw.trim()) {
    return { roles: [raw.trim()] };
  }
  return { roles: [] };
}

export type PlannerUnibotResult = {
  response: string;
};

/**
 * Calls Django `POST /api/unibot-api/` for section `planner`.
 * Use `message: ""` for the first profile-based topic batch; `"Continue"` for follow-up batches (matches v1).
 */
export async function fetchPlannerTopicsFromUnibot(message: string): Promise<PlannerUnibotResult> {
  const res = await authedFetch(`/api/unibot-api/`, {
    method: "POST",
    body: JSON.stringify({ message, sectionName: "planner" }),
  });

  const data = (await res.json().catch(() => ({}))) as { response?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch topic suggestions");
  }

  if (typeof data.response !== "string") {
    throw new Error("Invalid response from Unibot");
  }

  return { response: data.response };
}

// ---------------------------------------------------------------------------
// LinkedIn content generation (contentgen assets)
// ---------------------------------------------------------------------------

export type GenerateContentGenResult = {
  id: string;
  existing: boolean;
};

/**
 * POST `/api/generate-asset/contentgen/` with `skip_generation: true` — shell only, no Unibot.
 */
export async function createContentGenShell(
  topic: string,
  options?: { funnel?: "top" | "middle" | "bottom"; mood?: string }
): Promise<GenerateContentGenResult> {
  const body: { topic: string; funnel?: string; mood?: string; skip_generation: boolean } = {
    topic,
    skip_generation: true,
  };
  if (options?.funnel) {
    body.funnel = options.funnel;
  }
  if (options?.mood?.trim()) {
    body.mood = options.mood.trim();
  }
  const res = await authedFetch(`/api/generate-asset/contentgen/`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string | number;
    existing?: boolean;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to create post");
  }

  if (data.id == null) {
    throw new Error("Invalid response from server");
  }

  return {
    id: String(data.id),
    existing: data.existing === true,
  };
}

/**
 * POST `/api/generate-asset/contentgen/` — creates asset and runs Django Unibot draft generation.
 */
export async function generateContentGenAsset(
  topic: string,
  options?: { funnel?: "top" | "middle" | "bottom" }
): Promise<GenerateContentGenResult> {
  const body: { topic: string; funnel?: string } = { topic };
  if (options?.funnel) {
    body.funnel = options.funnel;
  }
  const res = await authedFetch(`/api/generate-asset/contentgen/`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string | number;
    existing?: boolean;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to generate draft");
  }

  if (data.id == null) {
    throw new Error("Invalid response from server");
  }

  return {
    id: String(data.id),
    existing: data.existing === true,
  };
}

/**
 * GET `/api/unibot-history/?sectionName=...` — flat list of user/bot messages.
 */
export async function fetchUnibotChatHistory(sectionName: string): Promise<UnibotChatMessage[]> {
  const q = encodeURIComponent(sectionName);
  const res = await authedFetch(`/api/unibot-history/?sectionName=${q}`, { method: "GET" });

  const data = (await res.json().catch(() => ({}))) as {
    chat_history?: UnibotChatMessage[];
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load chat history");
  }

  return Array.isArray(data.chat_history) ? data.chat_history : [];
}

/**
 * GET `/api/asset-data/?assetType=contentgen`
 */
export async function fetchContentGenAssets(): Promise<ContentGenAssetItem[]> {
  const res = await authedFetch(`/api/asset-data/?assetType=contentgen`, { method: "GET" });

  const data = (await res.json().catch(() => ({}))) as {
    assetData?: ContentGenAssetItem[];
    error?: string;
  };

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load posts");
  }

  const list = data.assetData;
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map(item => ({
    ...item,
    id: String(item.id),
  }));
}

/**
 * POST `/api/update-delete-asset/contentgen/` with `action: "edit"` — persists `content` and optional `dateScheduled`, `status`, `images`.
 */
export async function updateContentGenAsset(params: {
  id: string;
  content?: string;
  dateScheduled?: string | null;
  status?: string;
  images?: string[];
}): Promise<ContentGenMutationResult> {
  try {
    const body: Record<string, unknown> = {
      action: "edit",
      id: params.id,
    };
    if (params.content !== undefined) body.content = params.content;
    if (params.dateScheduled !== undefined) body.dateScheduled = params.dateScheduled;
    if (params.status !== undefined) body.status = params.status;
    if (params.images !== undefined) body.images = params.images;

    const res = await authedFetch(`/api/update-delete-asset/contentgen/`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try {
      if (rawText.trim()) {
        data = JSON.parse(rawText) as Record<string, unknown>;
      }
    } catch {
      data = {};
    }

    if (!res.ok) {
      const jsonError = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : undefined;
      return {
        success: false,
        error: messageFromFailedResponse(res.status, rawText, jsonError ?? "Failed to save your post."),
      };
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: sanitizeUserFacingError(e instanceof Error ? e.message : "", "Failed to save your post."),
    };
  }
}

function messageFromUnknownJsonBody(data: Record<string, unknown>, rawText: string, status: number, statusText: string): string {
  const asTrimmedString = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim() : undefined);

  const fromDetail = (detail: unknown): string | undefined => {
    const s = asTrimmedString(detail);
    if (s) return s;
    if (Array.isArray(detail)) {
      const parts = detail
        .map(item => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "message" in item) {
            return asTrimmedString((item as { message?: unknown }).message);
          }
          return undefined;
        })
        .filter((x): x is string => Boolean(x));
      return parts.length ? parts.join(" ") : undefined;
    }
    if (detail && typeof detail === "object") {
      try {
        const encoded = JSON.stringify(detail);
        return encoded.length > 2 ? encoded.slice(0, 500) : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const httpSummary = statusText.trim() ? `HTTP ${status} ${statusText.trim()}` : status ? `HTTP ${status}` : undefined;

  const trimmedRaw = rawText.trim();
  const bodySnippet = trimmedRaw.length > 0 ? trimmedRaw.slice(0, 800) : undefined;

  const serializeTopLevel = (): string | undefined => {
    if (Object.keys(data).length === 0) return undefined;
    try {
      const s = JSON.stringify(data);
      return s.length > 2 && s !== "{}" ? s.slice(0, 600) : undefined;
    } catch {
      return undefined;
    }
  };

  const specific =
    asTrimmedString(data.error) ??
    asTrimmedString(data.message) ??
    fromDetail(data.detail) ??
    serializeTopLevel() ??
    bodySnippet ??
    httpSummary;

  if (specific) {
    return httpSummary && !specific.includes(`HTTP ${status}`) ? `${specific} (${httpSummary})` : specific;
  }

  return httpSummary ?? "Failed to post to LinkedIn";
}

/**
 * POST `/api/post-to-linkedin/` — publishes the contentgen asset to LinkedIn (content must already be saved on the asset).
 */
export async function postContentGenToLinkedIn(id: string): Promise<ContentGenMutationResult> {
  try {
    const res = await authedFetch(`/api/post-to-linkedin/`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try {
      if (rawText.trim()) {
        data = JSON.parse(rawText) as Record<string, unknown>;
      }
    } catch {
      data = {};
    }

    if (!res.ok) {
      return {
        success: false,
        error: sanitizeUserFacingError(
          messageFromUnknownJsonBody(data, rawText, res.status, res.statusText),
          "Failed to post to LinkedIn. Please try again."
        ),
      };
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: sanitizeUserFacingError(e instanceof Error ? e.message : "", "Failed to post to LinkedIn. Please try again."),
    };
  }
}

/**
 * POST `/api/media-upload/` with multipart form-data.
 */
export async function uploadContentGenMedia(
  file: File,
  category = "linkedin-post"
): Promise<{ url: string; blob_name?: string; id?: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const res = await authedFetch(`/api/media-upload/`, { method: "POST", body: formData });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    content?: { url?: string; blob_name?: string; id?: number };
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to upload media");
  }

  if (!data.content?.url) {
    throw new Error("Invalid media upload response");
  }

  return { url: data.content.url, blob_name: data.content.blob_name, id: data.content.id };
}

/**
 * POST `/api/update-delete-asset/contentgen/` with `action: "delete"`.
 */
export async function deleteContentGenAsset(id: string): Promise<void> {
  const res = await authedFetch(`/api/update-delete-asset/contentgen/`, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to delete");
  }
}
