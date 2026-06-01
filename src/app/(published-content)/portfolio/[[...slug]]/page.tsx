import Portfolio from "@/components/Portfolio";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import { fetchPublicPortfolioBySlug } from "@/features/portfolio/server-actions/portfolio-actions";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

type PublicPortfolioErrorProps = {
  title: string;
  message: string;
  status: number;
};

function PublicPortfolioError({ title, message, status }: PublicPortfolioErrorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status {status}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

function normalizeSlug(slugParts?: string[]): string | null {
  if (!slugParts?.length) return null;
  const [firstPart] = slugParts;
  const normalized = firstPart?.trim();
  return normalized ? normalized : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug?.length ? `${slug.join(" / ")} | Portfolio` : "Portfolio";
  return {
    title,
    description: "Public portfolio – built with Unimad.",
    openGraph: { title, description: "Public portfolio – built with Unimad." },
  };
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { slug } = await params;
  const portfolioSlug = normalizeSlug(slug);

  if (!portfolioSlug) {
    return <PublicPortfolioError title="Portfolio not found" message="This public link does not exist or was removed." status={404} />;
  }

  let result: Awaited<ReturnType<typeof fetchPublicPortfolioBySlug>>;
  try {
    result = await fetchPublicPortfolioBySlug(portfolioSlug);
  } catch {
    return (
      <PublicPortfolioError
        title="Unable to load portfolio"
        message="Public portfolio links are not configured correctly on this environment. Ask the team to set UNIMAD_PUBLIC_ASSET_SECRET (or JWT_SECRET) to match the backend SECRET_KEY."
        status={500}
      />
    );
  }

  if (!result.ok) {
    const isNotFound = result.status === 404;
    return (
      <PublicPortfolioError
        title={isNotFound ? "Portfolio not found" : "Unable to load portfolio"}
        message={
          isNotFound
            ? "This public link does not exist or was removed."
            : result.error || "Something went wrong while loading this portfolio."
        }
        status={result.status}
      />
    );
  }

  const mapped = mapBackendPortfolioToFrontend(result.assetData);
  const dataWithSlug = {
    ...mapped,
    slug: mapped.slug ?? portfolioSlug,
  };

  return <Portfolio portfolioId={dataWithSlug.id || `public-${portfolioSlug}`} initialData={dataWithSlug} isReadOnly />;
}
