import { getMinimalOnboardingGateState } from "@/lib/actions/onboardingActions";
import { redirect } from "next/navigation";

/**
 * Hard gate: phone + LinkedIn must be saved before using Uniboard.
 * Profile setup (name, education, skills, etc.) is enforced separately via OnboardingGateModal.
 */
export async function requireMinimalOnboarding() {
  const state = await getMinimalOnboardingGateState();
  if (state.kind === "incomplete") {
    redirect("/onboarding");
  }
}
