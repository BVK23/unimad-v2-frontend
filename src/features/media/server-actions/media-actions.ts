"use server";

import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse, sanitizeUserFacingError } from "@/utils/message-from-failed-response";

export type DeleteMediaResult = { success: true; markedDeleted: true; gcsDeleted: boolean } | { success: false; error: string };

/**
 * Soft-delete media via DELETE /api/media-delete/.
 * Always returns a result object (never throws) so Next production digests don't leak.
 */
export async function deleteMediaByUrl(url: string, blobName?: string): Promise<DeleteMediaResult> {
  const trimmed = url.trim();
  if (!trimmed && !blobName?.trim()) {
    return { success: false, error: "Nothing to delete." };
  }

  try {
    const res = await authedFetch("/api/media-delete/", {
      method: "DELETE",
      body: JSON.stringify({
        ...(trimmed ? { url: trimmed } : {}),
        ...(blobName?.trim() ? { blob_name: blobName.trim() } : {}),
      }),
    });

    const bodyText = await res.text();
    let parsed: { error?: string; gcs_deleted?: boolean; marked_deleted?: boolean } = {};
    try {
      parsed = JSON.parse(bodyText) as typeof parsed;
    } catch {
      // non-JSON
    }

    if (!res.ok) {
      // 404 = already gone; treat as success for optimistic UI.
      if (res.status === 404) {
        return { success: true, markedDeleted: true, gcsDeleted: true };
      }
      const msg = messageFromFailedResponse(res.status, bodyText, parsed.error);
      return { success: false, error: sanitizeUserFacingError(msg, "Could not delete this file. Please try again.") };
    }

    return {
      success: true,
      markedDeleted: true,
      gcsDeleted: parsed.gcs_deleted !== false,
    };
  } catch (error) {
    console.error("[media-delete] failed", error);
    return { success: false, error: "Could not delete this file. Please try again." };
  }
}
