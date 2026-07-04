import { redirect } from "next/navigation";

/** Legacy route — new flow lives at /uniboard/onboarding */
export default function LegacyOnboardingRedirect() {
  redirect("/uniboard/onboarding");
}
