import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug?.length ? `VPD | ${slug.join(" / ")}` : "Value Prop Doc";
  return {
    title,
    description: "Public value prop document – built with Unimad.",
    openGraph: { title, description: "Public value prop document – built with Unimad." },
  };
}

export default async function PublicVPDPage({ params }: Props) {
  const { slug } = await params;
  // TODO: Fetch VPD data by slug (SSR) when backend is ready
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Public VPD</h1>
        <p className="text-slate-600">{slug?.length ? `Slug: ${slug.join("/")}` : "Value prop doc – connect a backend to load content."}</p>
      </div>
    </div>
  );
}
