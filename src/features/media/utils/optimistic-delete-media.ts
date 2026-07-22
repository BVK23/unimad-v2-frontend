import { deleteMediaByUrl } from "@/features/media/server-actions/media-actions";
import { isAppManagedMediaUrl } from "@/features/media/utils/is-app-managed-media-url";

/**
 * Fire-and-forget GCS/MediaStore cleanup after the UI has already removed the asset.
 * Skips third-party Google/LinkedIn URLs. Never throws to the caller.
 */
export function optimisticDeleteMedia(url: string | null | undefined, blobName?: string): void {
  const trimmed = (url ?? "").trim();
  if (!trimmed || !isAppManagedMediaUrl(trimmed)) return;

  void deleteMediaByUrl(trimmed, blobName).then(result => {
    if (!result.success) {
      console.error("[optimistic-media-delete] marked failure", { url: trimmed.slice(0, 80), error: result.error });
      return;
    }
    if (!result.gcsDeleted) {
      console.warn("[optimistic-media-delete] row marked deleted; GCS cleanup pending", {
        url: trimmed.slice(0, 80),
      });
    }
  });
}
