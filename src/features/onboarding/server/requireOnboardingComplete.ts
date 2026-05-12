import { getOnboardingGateState } from "@/lib/actions/onboardingActions";
import { redirect } from "next/navigation";

/**
 * Server-side gate for routes that require onboarding to be complete.
 *
 * - If the user has no auth token, we let the page render. The page (or
 *   downstream auth flow) is responsible for prompting sign-in; we don't want
 *   to bounce unauthenticated visitors away from public-leaning surfaces.
 * - If onboarding is incomplete, we redirect to /onboarding.
 * - On any backend hiccup we fail open so the user isn't stuck in a redirect loop.
 */
export async function requireOnboardingComplete() {
  const state = await getOnboardingGateState();
  if (state.kind === "incomplete") {
    redirect("/onboarding");
  }
}
