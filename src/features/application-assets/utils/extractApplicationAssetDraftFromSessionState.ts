/** Read generated draft body from ADK session state after studio headless stream. */

const readNestedDraftBody = (state: Record<string, unknown>): string => {
  const data = state.application_asset_data;
  if (!data || typeof data !== "object") {
    return "";
  }
  const activeKey = typeof state.current_application_asset === "string" ? state.current_application_asset : "active";
  const row = (data as Record<string, unknown>)[activeKey];
  if (row && typeof row === "object" && typeof (row as { body?: unknown }).body === "string") {
    return ((row as { body: string }).body ?? "").trim();
  }
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (value && typeof value === "object" && typeof (value as { body?: unknown }).body === "string") {
      const body = ((value as { body: string }).body ?? "").trim();
      if (body) {
        return body;
      }
    }
  }
  return "";
};

export const extractApplicationAssetDraftFromSessionState = (state: Record<string, unknown> | null): string => {
  if (!state) {
    return "";
  }
  const nested = readNestedDraftBody(state);
  if (nested) {
    return nested;
  }
  const preview = state.application_asset_draft_preview;
  if (typeof preview === "string" && preview.trim()) {
    return preview.trim();
  }
  return "";
};
