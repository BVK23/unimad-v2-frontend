import { requireOnboardingComplete } from "@/features/onboarding/server/requireOnboardingComplete";
import ResumePageClient from "./ResumePageClient";

export const metadata = {
  title: "Resume",
  description: "Resume dashboard and editor",
};

type ResumePageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

export default async function ResumePage({ searchParams }: ResumePageProps) {
  await requireOnboardingComplete();
  const params = await searchParams;
  const rawId = params.id;
  const initialResumeId = typeof rawId === "string" && rawId.trim() !== "" ? rawId.trim() : undefined;

  return <ResumePageClient initialResumeId={initialResumeId} />;
}
