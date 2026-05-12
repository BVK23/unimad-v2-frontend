import { Suspense } from "react";
import { requireOnboardingComplete } from "@/features/onboarding/server/requireOnboardingComplete";
import ResumePageClient from "./ResumePageClient";

export const metadata = {
  title: "Resume",
  description: "Resume dashboard and editor",
};

export default async function ResumePage() {
  await requireOnboardingComplete();
  return (
    <Suspense fallback={null}>
      <ResumePageClient />
    </Suspense>
  );
}
