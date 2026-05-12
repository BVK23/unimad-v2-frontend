import { requireOnboardingComplete } from "@/features/onboarding/server/requireOnboardingComplete";
import PortfolioPageClient from "./PortfolioPageClient";

export const metadata = {
  title: "Portfolio",
  description: "Your portfolio and profile",
};

export default async function PortfolioPage() {
  await requireOnboardingComplete();
  return <PortfolioPageClient />;
}
