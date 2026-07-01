export const MASTERCLASS_LEAD_SOURCE_VSL_VIDEO = "vsl_video";
export const MASTERCLASS_LEAD_SOURCE_DISCOVERY = "discovery_vsl";

export const MASTERCLASS_WELCOME_PATH = "/masterclass/welcome";
export const MASTERCLASS_BOOKING_PATH = MASTERCLASS_WELCOME_PATH;

export const MASTERCLASS_THANK_YOU_PATH = "/masterclass/thank-you";

export const MASTERCLASS_SUPPORT_EMAIL = "grow@unimad.ai";

export const MASTERCLASS_VSL_FORM_COMPLETE_KEY = "masterclass_vsl_form_complete";
export const MASTERCLASS_LEAD_SESSION_KEY = "masterclass_lead";
export const MASTERCLASS_WELCOME_AUTOREDIRECT_KEY = "masterclass_welcome_autoredirect";

export const MASTERCLASS_DISCOVERY_CALL_URL = "https://calendly.com/unimad_ai/unicoach-1-1-consultation";

export const MASTERCLASS_WHATSAPP_NUMBER_DISPLAY = "+1 (555) 754-4333";
export const MASTERCLASS_WHATSAPP_URL = "https://wa.me/15557544333";

export const MASTERCLASS_VIDEO_URL = "https://storage.googleapis.com/unimadai-public-assets/Unimad-Masterclass-VSL-GTM.mp4";

export function getMasterclassThankYouUrl(origin?: string) {
  const base = origin || process.env.NEXT_PUBLIC_BASE_URL || "https://unimad.ai";
  return `${base.replace(/\/$/, "")}${MASTERCLASS_THANK_YOU_PATH}`;
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
