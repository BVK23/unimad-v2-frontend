import { canAccessInternalDesignDocs, INTERNAL_DESIGN_DOC_SLUGS } from "@/lib/internal-design-docs";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

const DOC_LABELS: Record<string, string> = {
  "design-system": "Unimad Design System",
  "brand-book": "Master Brand Book",
};

export default async function InternalDesignIndexPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const allowed = await canAccessInternalDesignDocs(host);
  if (!allowed) notFound();

  return (
    <main className="min-h-screen bg-slate-50 p-8 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">Internal</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Design guidelines</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            For Unimad team and local development. Not indexed or linked in the product UI.
          </p>
        </div>
        <ul className="space-y-2">
          {INTERNAL_DESIGN_DOC_SLUGS.map(slug => (
            <li key={slug}>
              <Link
                href={`/internal/design/${slug}`}
                className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/50"
              >
                {DOC_LABELS[slug] ?? slug}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
