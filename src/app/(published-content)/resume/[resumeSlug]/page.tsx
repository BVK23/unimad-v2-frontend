import type { Metadata } from "next";

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
  // TODO: Fetch resume data by resumeSlug (SSR) when backend is ready for SEO
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Public Resume
        </h1>
        <p className="text-slate-600">
          Resume: {resumeSlug} – connect a backend to load and render resume content for SEO.
        </p>
      </div>
    </div>
  );
}
