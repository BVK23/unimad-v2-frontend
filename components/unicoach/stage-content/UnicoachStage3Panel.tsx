"use client";

import { UNICOACH_JOB_SITES } from "@/constants/unicoach-niche-content";
import { JOBS_BOARD_HREF, JOBS_TRACKER_HREF } from "@/src/features/jobs/jobs-url";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

function ExternalJobSiteLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={className}>
      {children}
    </a>
  );
}

export const UnicoachStage3OverviewPanel = () => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      On Call 2 you will walk through one quality application together. Before the call, shortlist roles and use your job tracker to stay
      organised.
    </p>
    <Link
      href={JOBS_TRACKER_HREF}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
    >
      Open Jobs tracker
      <ExternalLink size={14} />
    </Link>
  </div>
);

export const UnicoachStage3ResourcesPanel = () => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Shortlist roles in Jobs, then use these sites for your quantity applications.
    </p>
    <Link
      href={JOBS_BOARD_HREF}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
    >
      Open Jobs
      <ExternalLink size={14} />
    </Link>
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
            <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Name</th>
            <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Website</th>
          </tr>
        </thead>
        <tbody>
          {UNICOACH_JOB_SITES.map(site => (
            <tr key={site.url} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                <ExternalJobSiteLink
                  href={site.url}
                  className="text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {site.name}
                </ExternalJobSiteLink>
              </td>
              <td className="px-4 py-2.5">
                <ExternalJobSiteLink
                  href={site.url}
                  className="text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {site.url}
                </ExternalJobSiteLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
