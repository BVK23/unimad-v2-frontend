/** Avoid surfacing Django HTML debug pages or other non-JSON error bodies in the UI. */
export function messageFromFailedResponse(status: number, bodyText: string, jsonError?: string): string {
  const candidate = (jsonError ?? bodyText).trim();
  const lower = candidate.toLowerCase();
  const looksLikeHtml =
    lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.includes("<title>") || lower.includes("attributeerror at /api");

  if (looksLikeHtml || !candidate) {
    return status >= 500 ? "Something went wrong on our end. Please try again in a moment." : "Request failed. Please try again.";
  }

  return candidate.length > 400 ? `${candidate.slice(0, 400)}…` : candidate;
}
