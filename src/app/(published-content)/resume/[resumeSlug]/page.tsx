import PublicResumeView from "@/components/resume/PublicResumeView";
import { mapBackendResumeToFrontend } from "@/features/resume/api/mappers";
import { fetchPublicResumeBySlug } from "@/features/resume/server-actions/resume-actions";
import type { Metadata } from "next";
import PublicResumeError from "./PublicResumeError";

type Props = {
  params: Promise<{ resumeSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resumeSlug } = await params;
  return {
    title: `Resume | ${resumeSlug}`,
    description: "Public resume – built with Unimad.",
    openGraph: {
      title: `Resume | ${resumeSlug}`,
      description: "Public resume – built with Unimad.",
    },
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { resumeSlug } = await params;

  let result: Awaited<ReturnType<typeof fetchPublicResumeBySlug>>;
  try {
    result = await fetchPublicResumeBySlug(resumeSlug);
  } catch {
    return (
      <PublicResumeError
        title="Unable to load resume"
        message="Public resume links are not configured correctly on this environment. Ask the team to set UNIMAD_PUBLIC_ASSET_SECRET (or JWT_SECRET) to match the backend SECRET_KEY."
        status={500}
      />
    );
  }

  if (!result.ok) {
    const isNotFound = result.status === 404;
    return (
      <PublicResumeError
        title={isNotFound ? "Resume not found" : "Unable to load resume"}
        message={
          isNotFound ? "This public link does not exist or was removed." : result.error || "Something went wrong while loading this resume."
        }
        status={result.status}
      />
    );
  }

  const mapped = mapBackendResumeToFrontend(result.assetData);
  const dataWithSlug = {
    ...mapped,
    slug: mapped.slug ?? resumeSlug,
  };

  return <PublicResumeView data={dataWithSlug} />;
}
