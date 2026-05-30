"use client";

import { UNICOACH_JOB_SITES } from "@/constants/unicoach-niche-content";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const UnicoachStage3OverviewPanel = () => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      On Call 2 you will walk through one quality application together. Before the call, shortlist roles and use your job tracker to stay
      organised.
    </p>
    <Link
      href="/uniboard/jobs"
      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
    >
      Open Jobs tracker
      <ExternalLink size={14} />
    </Link>
  </div>
);

export const UnicoachStage3ResourcesPanel = () => (
  <div className="space-y-3">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Sites to apply — bookmark these for your shortlist and quantity applications.
    </p>
    <ul className="grid gap-2 sm:grid-cols-2">
      {UNICOACH_JOB_SITES.map(site => (
        <li key={site.url}>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900/50"
          >
            {site.name}
            <ExternalLink size={14} className="shrink-0 text-slate-400" />
          </a>
        </li>
      ))}
    </ul>
  </div>
);
