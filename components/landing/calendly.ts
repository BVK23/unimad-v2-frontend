"use client";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
      initInlineWidget?: (options: { url: string; parentElement: HTMLElement }) => void;
    };
  }
}

const CALENDLY_EVENT_URL = "https://calendly.com/unimad_ai/onboarding-to-unimad";

export const buildCalendlyUrl = (origin: string, prefill?: { name?: string; email?: string }) => {
  const params = new URLSearchParams({
    hide_event_type_details: "1",
    hide_gdpr_banner: "1",
  });
  if (prefill?.name) params.set("name", prefill.name);
  if (prefill?.email) params.set("email", prefill.email);
  return `${CALENDLY_EVENT_URL}?${params.toString()}`;
};

export const openCalendlyPopup = (prefill?: { name?: string; email?: string }) => {
  if (typeof window === "undefined") return;

  const url = buildCalendlyUrl(window.location.origin, prefill);

  const checkCalendly = (attempts = 0) => {
    if (window.Calendly) {
      try {
        window.Calendly.initPopupWidget({ url });
      } catch {
        window.open(url, "_blank");
      }
      return;
    }
    if (attempts < 15) {
      setTimeout(() => checkCalendly(attempts + 1), 200);
      return;
    }
    window.open(url, "_blank");
  };

  checkCalendly();
};
