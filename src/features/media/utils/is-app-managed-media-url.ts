/**
 * Media we host in GCS / MediaStore can be deleted.
 * Google / LinkedIn avatar URLs are third-party and must not get a delete control.
 */
export function isAppManagedMediaUrl(url: string | null | undefined): boolean {
  const value = (url ?? "").trim().toLowerCase();
  if (!value) return false;

  if (
    value.includes("googleusercontent.com") ||
    value.includes("ggpht.com") ||
    value.includes("licdn.com") ||
    value.includes("linkedin.com/") ||
    value.includes("media.licdn.com")
  ) {
    return false;
  }

  return (
    value.includes("storage.googleapis.com") ||
    value.includes("storage.cloud.google.com") ||
    value.startsWith("/") ||
    value.includes("localhost")
  );
}
