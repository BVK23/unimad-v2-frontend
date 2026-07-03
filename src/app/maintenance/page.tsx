import { UnimadLogo } from "@/components/unimad-logo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scheduled Maintenance",
  robots: { index: false, follow: false },
};

/**
 * Use during migrations: temporarily redirect /uniboard/* to /maintenance in src/proxy.ts
 * or enable a Vercel maintenance mode while backend migrations run.
 */
export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-4">
      <div className="w-full max-w-lg text-center">
        <Link href="/" className="inline-block" aria-label="Unimad home">
          <UnimadLogo className="mx-auto mb-8 h-12 w-auto" />
        </Link>
        <h1 className="mb-4 text-3xl font-semibold text-slate-900 md:text-4xl">Scheduled maintenance</h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-600">
          We&apos;re performing scheduled maintenance to improve your experience. This won&apos;t take long, and we&apos;ll be back shortly.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-700"
        >
          Back to homepage
        </Link>
        <p className="mt-8 text-sm font-medium text-slate-500">Thank you for your patience</p>
      </div>
    </div>
  );
}
