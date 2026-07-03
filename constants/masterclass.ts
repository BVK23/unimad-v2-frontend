export const MASTERCLASS_LEAD_SOURCE_VSL_VIDEO = "vsl_video";
export const MASTERCLASS_LEAD_SOURCE_DISCOVERY = "discovery_vsl";

export const MASTERCLASS_CONFIRMED_PATH = "/masterclass/confirmed";
export const MASTERCLASS_THANKS_INTEREST_PATH = "/masterclass/thanks-for-interest";
export const MASTERCLASS_ORGANIC_PATH = "/masterclass/organic";

/** @deprecated Use MASTERCLASS_CONFIRMED_PATH */
export const MASTERCLASS_WELCOME_PATH = MASTERCLASS_CONFIRMED_PATH;
export const MASTERCLASS_BOOKING_PATH = MASTERCLASS_CONFIRMED_PATH;

export const MASTERCLASS_THANK_YOU_PATH = "/masterclass/thank-you";

export const MASTERCLASS_SUPPORT_EMAIL = "grow@unimad.ai";

export const MASTERCLASS_VSL_FORM_COMPLETE_KEY = "masterclass_vsl_form_complete";
export const MASTERCLASS_LEAD_SESSION_KEY = "masterclass_lead";
export const MASTERCLASS_WELCOME_AUTOREDIRECT_KEY = "masterclass_welcome_autoredirect";

export const MASTERCLASS_DISCOVERY_CALENDLY_URL = "https://calendly.com/unimad_ai/unicoach-1-1-consultation";

/** @deprecated Use MASTERCLASS_DISCOVERY_CALENDLY_URL */
export const MASTERCLASS_DISCOVERY_CALL_URL = MASTERCLASS_DISCOVERY_CALENDLY_URL;

export const MASTERCLASS_WHATSAPP_NUMBER_DISPLAY = "+1 (555) 754-4333";
export const MASTERCLASS_WHATSAPP_URL = "https://wa.me/15557544333";

export const MASTERCLASS_EVENT_DATE_LABEL = "Wednesday, 24th June";

export const MASTERCLASS_VIDEO_URL = "https://storage.googleapis.com/unimadai-public-assets/Unimad-Masterclass-VSL-GTM.mp4";

export const MASTERCLASS_VIDEO_PLAYBACK_RATE = 1.125;

export const MASTERCLASS_CALENDLY_EMBED_URL =
  "https://calendly.com/unimad_ai/onboarding-to-unimad/2026-06-24T16:00:00Z?hide_event_type_details=1&hide_gdpr_banner=1";

export function getMasterclassConfirmedUrl(origin?: string, uid: string | null = null) {
  const base = origin || process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  const path =
    uid != null && uid !== "" ? `${MASTERCLASS_CONFIRMED_PATH}?uid=${encodeURIComponent(String(uid))}` : MASTERCLASS_CONFIRMED_PATH;
  return `${base.replace(/\/$/, "")}${path}`;
}

export function normalizeCalendlyPrefill(prefill: Record<string, string | undefined> = {}) {
  const rawName = prefill.name || "";
  let name = rawName.replace(/\+/g, " ").trim();
  try {
    if (rawName.includes("%")) {
      name = decodeURIComponent(rawName.replace(/\+/g, " ")).trim();
    }
  } catch {
    // keep decoded-plus fallback
  }
  return {
    name,
    email: (prefill.email || "").trim(),
  };
}

export function buildMasterclassDiscoveryCalendlyUrl(origin: string | undefined, prefill: Record<string, string | undefined> = {}) {
  const normalized = normalizeCalendlyPrefill(prefill);
  const queryParts = [
    "hide_event_type_details=1",
    "hide_gdpr_banner=1",
    `redirect_url=${encodeURIComponent(getMasterclassConfirmedUrl(origin, prefill.uid))}`,
  ];
  if (normalized.name) {
    queryParts.push(`name=${encodeURIComponent(normalized.name)}`);
  }
  if (normalized.email) {
    queryParts.push(`email=${encodeURIComponent(normalized.email)}`);
  }
  return `${MASTERCLASS_DISCOVERY_CALENDLY_URL}?${queryParts.join("&")}`;
}

export function getMasterclassThankYouUrl(origin?: string) {
  const base = origin || process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${MASTERCLASS_THANK_YOU_PATH}`;
}

export function buildMasterclassCalendlyUrl(origin?: string) {
  const redirectUrl = encodeURIComponent(getMasterclassThankYouUrl(origin));
  return `${MASTERCLASS_CALENDLY_EMBED_URL}&redirect_url=${redirectUrl}`;
}

export function buildMasterclassSignupUrl(intent: string, uid: string | null = null) {
  const params = new URLSearchParams({
    redirect: "home",
    masterclass_intent: intent,
  });
  if (uid != null && uid !== "") {
    params.set("uid", String(uid));
  }
  return `/signin?${params.toString()}`;
}

export function buildMasterclassUnicoachSignupUrl(uid: string | null = null) {
  const params = new URLSearchParams({
    redirect: "unicoach",
    masterclass_intent: "discovery",
  });
  if (uid != null && uid !== "") {
    params.set("uid", String(uid));
  }
  return `/signin?${params.toString()}`;
}

/** @deprecated Niche tab is no longer required before discovery booking. */
export function buildMasterclassNicheSignupUrl(uid: string | null = null) {
  const params = new URLSearchParams({
    redirect: "unicoach",
    tab: "niche",
    masterclass_intent: "discovery",
  });
  if (uid != null && uid !== "") {
    params.set("uid", String(uid));
  }
  return `/signin?${params.toString()}`;
}

export function buildMasterclassBookDiscoveryUrl(uid: string) {
  const params = new URLSearchParams({ book: "discovery", uid: String(uid) });
  return `/masterclass?${params.toString()}`;
}

export function buildMasterclassWatchUrl(uid: string) {
  const params = new URLSearchParams({ watch: "1", uid: String(uid) });
  return `/masterclass?${params.toString()}`;
}

export function buildMasterclassSignupAbsoluteUrl(intent: string, uid: string | null = null) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${buildMasterclassSignupUrl(intent, uid)}`;
}

export function buildMasterclassUnicoachSignupAbsoluteUrl(uid: string | null = null) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${buildMasterclassUnicoachSignupUrl(uid)}`;
}

export function buildMasterclassNicheSignupAbsoluteUrl(uid: string | null = null) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${buildMasterclassNicheSignupUrl(uid)}`;
}

export function buildMasterclassBookDiscoveryAbsoluteUrl(uid: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${buildMasterclassBookDiscoveryUrl(uid)}`;
}

export function buildMasterclassWatchAbsoluteUrl(uid: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${buildMasterclassWatchUrl(uid)}`;
}
