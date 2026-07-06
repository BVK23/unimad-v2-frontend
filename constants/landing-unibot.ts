const LANDING_UNIBOT_DRAFT_KEY = "landing_unibot_draft";

export function storeLandingUnibotDraft(message: string): void {
  if (typeof window === "undefined") return;
  const trimmed = message.trim();
  if (!trimmed) return;
  sessionStorage.setItem(LANDING_UNIBOT_DRAFT_KEY, trimmed);
}

export function consumeLandingUnibotDraft(): string | null {
  if (typeof window === "undefined") return null;
  const draft = sessionStorage.getItem(LANDING_UNIBOT_DRAFT_KEY);
  if (!draft) return null;
  sessionStorage.removeItem(LANDING_UNIBOT_DRAFT_KEY);
  return draft;
}
