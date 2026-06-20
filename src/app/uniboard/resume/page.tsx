import ResumePageClient from "./ResumePageClient";

export const metadata = {
  title: "Resume",
  description: "Resume dashboard and editor",
};

type ResumePageProps = {
  searchParams: Promise<{ id?: string | string[]; new?: string | string[] }>;
};

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const rawId = params.id;
  const initialResumeId = typeof rawId === "string" && rawId.trim() !== "" ? rawId.trim() : undefined;
  const rawNew = params.new;
  const initialIsNewDraft = rawNew === "scratch" || (Array.isArray(rawNew) && rawNew.includes("scratch"));

  return <ResumePageClient initialResumeId={initialResumeId} initialIsNewDraft={initialIsNewDraft} />;
}
