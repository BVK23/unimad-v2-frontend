"use client";

import { useState } from "react";
import { UNICOACH_PERSONAL_BRANDING_VIDEO_URL } from "@/constants/unicoach-niche-content";
import { LINKEDIN_COMMENT_EXTENSION_URL } from "@/features/linkedin/constants";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UnicoachLinkedInPostsModal } from "./UnicoachLinkedInPostsModal";

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

function CtaLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls =
    "inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <ExternalLink size={14} />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <ExternalLink size={14} />
    </Link>
  );
}

export const UnicoachStage4OverviewPanel = () => {
  const [postsOpen, setPostsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Accordion title="Personal branding video" defaultOpen>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Watch this guide, then work through the CCC framework and daily habits below.
        </p>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
          <video src={UNICOACH_PERSONAL_BRANDING_VIDEO_URL} controls className="h-full w-full object-cover" preload="metadata" />
        </div>
      </Accordion>

      <Accordion title="CCC framework">
        <p className="text-sm text-slate-600 dark:text-slate-300">The CCC framework is your roadmap to an unignorable personal brand:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>Making connections</li>
          <li>Posting comments</li>
          <li>Posting content</li>
        </ul>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Master these three pillars and you move from job seeker to sought-after professional.
        </p>
      </Accordion>

      <Accordion title="Making connections">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Use Unimad&apos;s LinkedIn connections workflow to build targeted outreach lists.
        </p>
        <CtaLink href="/uniboard/linkedin#connection">Open Connections</CtaLink>
      </Accordion>

      <Accordion title="Making comments">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Install the Unimad Chrome extension to draft thoughtful comments on posts in your feed.
        </p>
        <CtaLink href={LINKEDIN_COMMENT_EXTENSION_URL} external>
          Get Chrome extension
        </CtaLink>
      </Accordion>

      <Accordion title="Posting content">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Draft and schedule LinkedIn posts in Studio.</p>
        <CtaLink href="/uniboard/studio?type=linkedin-post">Open LinkedIn Post studio</CtaLink>
      </Accordion>

      <Accordion title="30-day LinkedIn post ideas">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
          Day-by-day prompts and example posts to kick-start your content rhythm.
        </p>
        <button
          type="button"
          onClick={() => setPostsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200"
        >
          View 30-day post ideas
        </button>
      </Accordion>

      <UnicoachLinkedInPostsModal open={postsOpen} onClose={() => setPostsOpen(false)} />
    </div>
  );
};
