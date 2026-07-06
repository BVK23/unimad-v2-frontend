/** Uniboard segment passed through `/signin?redirect=` after OAuth. */
export type LandingFeatureRedirect = "resume" | "portfolio" | "jobs" | "linkedin" | "studio" | "home";

const SIGNIN_PATH = "/signin";

/** Maps product showcase ids to post-auth uniboard destinations. */
export const SHOWCASE_FEATURE_REDIRECTS: Record<string, LandingFeatureRedirect> = {
  resume: "resume",
  portfolio: "portfolio",
  jobs: "jobs",
  linkedin: "linkedin",
  "content-lab": "studio",
  interviews: "jobs",
};

export function getSigninUrl(redirect?: LandingFeatureRedirect | string): string {
  if (!redirect || redirect === "home") return SIGNIN_PATH;
  return `${SIGNIN_PATH}?redirect=${encodeURIComponent(redirect)}`;
}

export function getFeatureSigninUrl(productId: string): string {
  const redirect = SHOWCASE_FEATURE_REDIRECTS[productId] ?? "resume";
  return getSigninUrl(redirect);
}

export function getFeatureDestinationPath(productId: string): string {
  const redirect = SHOWCASE_FEATURE_REDIRECTS[productId] ?? "resume";
  if (redirect === "home" || redirect === "resume") return "/uniboard";
  return `/uniboard/${redirect}`;
}

export function resolveFeatureHref(productId: string, isAuthenticated: boolean): string {
  if (isAuthenticated) return getFeatureDestinationPath(productId);
  return getFeatureSigninUrl(productId);
}

export const MASTERCLASS_PATH = "/masterclass";
export const MASTERCLASS_ORGANIC_PATH = "/masterclass/organic";
