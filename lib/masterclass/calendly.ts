"use client";

import {
  MASTERCLASS_CONFIRMED_PATH,
  MASTERCLASS_DISCOVERY_CALENDLY_URL,
  buildMasterclassDiscoveryCalendlyUrl,
  normalizeCalendlyPrefill,
} from "@/constants/masterclass";

export { normalizeCalendlyPrefill };

type CalendlyPrefill = {
  name?: string;
  email?: string;
  uid?: string;
};

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export function openMasterclassDiscoveryCalendly(prefill: CalendlyPrefill = {}, onScheduled?: () => void) {
  if (typeof window === "undefined") return;

  const normalized = normalizeCalendlyPrefill(prefill);
  const url = buildMasterclassDiscoveryCalendlyUrl(window.location.origin, {
    ...normalized,
    uid: prefill.uid,
  });

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== "https://calendly.com") return;
    if (event.data?.event === "calendly.event_scheduled") {
      window.removeEventListener("message", handleMessage);
      onScheduled?.();
    }
  };

  window.addEventListener("message", handleMessage);

  const openWidget = (attempts = 0) => {
    if (window.Calendly?.initPopupWidget) {
      try {
        window.Calendly.initPopupWidget({ url });
      } catch {
        window.open(url, "_blank");
      }
      return;
    }
    if (attempts < 15) {
      setTimeout(() => openWidget(attempts + 1), 200);
      return;
    }
    window.open(url, "_blank");
  };

  openWidget();
}

export function ensureCalendlyAssets() {
  if (typeof document === "undefined") return () => {};

  let cssLink = document.querySelector('link[href*="calendly.com/assets/external/widget.css"]');
  if (!cssLink) {
    cssLink = document.createElement("link");
    cssLink.setAttribute("href", "https://assets.calendly.com/assets/external/widget.css");
    cssLink.setAttribute("rel", "stylesheet");
    document.head.appendChild(cssLink);
  }

  let script = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
  if (!script) {
    script = document.createElement("script");
    script.setAttribute("src", "https://assets.calendly.com/assets/external/widget.js");
    script.setAttribute("async", "true");
    document.head.appendChild(script);
  }

  return () => {};
}

export { MASTERCLASS_CONFIRMED_PATH, MASTERCLASS_DISCOVERY_CALENDLY_URL };
