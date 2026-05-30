"use client";

import { useState } from "react";
import { UNICOACH_VPD_VIDEO_URL } from "@/constants/unicoach-niche-content";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open ? <div className="border-t border-slate-100 dark:border-slate-800 px-3 pb-3 pt-3 space-y-3">{children}</div> : null}
    </div>
  );
}

export const UnicoachStage6OverviewPanel = () => (
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-brand-600 dark:text-brand-400">Your value proposition</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">60+ students landed jobs using Unimad — 47 because of a VPD.</p>
    </div>

    <Accordion title="Watch VPD session" defaultOpen>
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
        <video src={UNICOACH_VPD_VIDEO_URL} controls className="h-full w-full object-cover" preload="metadata" />
      </div>
    </Accordion>

    <Accordion title="What's a VPD?">
      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <li>How do you add value to the company?</li>
        <li>How does the company add value to you?</li>
        <li>How do you fit in with the company culture?</li>
      </ul>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Because in 2025, proactive candidates win.</p>
      <Link
        href="/uniboard/applications/vpd"
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Generate VPD
        <ExternalLink size={14} />
      </Link>
    </Accordion>

    <Accordion title="Interview preparation">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
        Use your job tracker interview prep tools for company research and mock rounds.
      </p>
      <Link
        href="/uniboard/jobs?tab=interview"
        className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
      >
        Open interview prep
        <ExternalLink size={14} />
      </Link>
    </Accordion>
  </div>
);

export const UnicoachStage6ResourcesPanel = () => (
  <div className="space-y-3">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Keep following the execution calendar on your dashboard. VPD and interview prep resources are in Overview.
    </p>
    <Link href="/uniboard/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
      Jobs tracker
      <ExternalLink size={14} />
    </Link>
  </div>
);
