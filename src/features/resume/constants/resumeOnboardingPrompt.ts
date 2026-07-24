const COOLDOWN_KEY = "resume-complete-onboarding-prompt-dismissed-at";
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const POST_ONBOARDING_GENERATE_RESUME_KEY = "resume-post-onboarding-generate-prompt-dismissed";

export const isResumeOnboardingPromptOnCooldown = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < TWELVE_HOURS_MS;
  } catch {
    return false;
  }
};

export const dismissResumeOnboardingPrompt = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // ignore quota errors
  }
};

export const clearResumeOnboardingPromptCooldown = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COOLDOWN_KEY);
  } catch {
    // ignore
  }
};

export const dismissPostOnboardingGenerateResumePrompt = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(POST_ONBOARDING_GENERATE_RESUME_KEY, "1");
};

export const isPostOnboardingGenerateResumeDismissed = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(POST_ONBOARDING_GENERATE_RESUME_KEY) === "1";
};
