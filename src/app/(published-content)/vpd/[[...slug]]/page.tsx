import PublishedVpdView from "@/components/studio/PublishedVpdView";
import { fetchPublicVpdBySlug } from "@/features/vpd/server-actions/vpd-actions";
import { mapVpdApiToStudioProject } from "@/features/vpd/utils/mapVpdApiToStudioProject";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

type PublicVpdErrorProps = {
  title: string;
  message: string;
  status: number;
};

function PublicVpdError({ title, message, status }: PublicVpdErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
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
  const title = slug?.length ? `${slug.join(" / ")} | Value Prop Doc` : "Value Prop Doc";
  return {
    title,
    description: "Public value proposition document – built with Unimad.",
    openGraph: { title, description: "Public value proposition document – built with Unimad." },
  };
}

export default async function PublicVPDPage({ params }: Props) {
  const { slug } = await params;
  const vpdSlug = normalizeSlug(slug);

  if (!vpdSlug) {
    return <PublicVpdError title="VPD not found" message="This public link does not exist or was removed." status={404} />;
  }

  let result: Awaited<ReturnType<typeof fetchPublicVpdBySlug>>;
  try {
    result = await fetchPublicVpdBySlug(vpdSlug);
  } catch {
    return (
      <PublicVpdError
        title="Unable to load VPD"
        message="Public VPD links are not configured correctly on this environment. Ask the team to set UNIMAD_PUBLIC_ASSET_SECRET (or JWT_SECRET) to match the backend SECRET_KEY."
        status={500}
      />
    );
  }

  if (!result.ok) {
    const isNotFound = result.status === 404;
    return (
      <PublicVpdError
        title={isNotFound ? "VPD not found" : "Unable to load VPD"}
        message={
          isNotFound
            ? "This public link does not exist or was removed."
            : result.error || "Something went wrong while loading this document."
        }
        status={result.status}
      />
    );
  }

  const project = mapVpdApiToStudioProject({
    ...result.assetData,
    slug: result.assetData.slug ?? vpdSlug,
  });

  return <PublishedVpdView project={project} />;
}
