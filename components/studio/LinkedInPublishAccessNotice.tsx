"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  buildLinkedInConnectUrl,
  type LinkedInPublishAccess,
  type LinkedInPublishBlockReason,
} from "@/features/linkedin/utils/linkedinPublishAccess";
import { ChevronDown, Info, Linkedin } from "lucide-react";

const COPY: Record<LinkedInPublishBlockReason, { short: string; detail: string; cta: string }> = {
  connect: {
    short: "Connect LinkedIn to post and schedule from Unimad.",
    detail: "Posting to LinkedIn needs a LinkedIn sign-in so we can publish on your behalf. Link your account once and you are set.",
    cta: "Connect LinkedIn",
  },
  reconnect: {
    short: "Your LinkedIn connection needs a quick refresh to keep posting.",
    detail: "It has been a while since you signed in with LinkedIn. Sign in again so we can publish and schedule posts for you.",
    cta: "Sign in with LinkedIn",
  },
};

type LinkedInPublishAccessNoticeProps = {
  access: LinkedInPublishAccess;
  userId?: number;
  variant?: "inline" | "panel";
  scheduleBeyondSession?: boolean;
  sessionEndsLabel?: string;
};

export function LinkedInPublishAccessNotice({
  access,
  userId,
  variant = "panel",
  scheduleBeyondSession = false,
  sessionEndsLabel,
}: LinkedInPublishAccessNoticeProps) {
  const [expanded, setExpanded] = useState(false);

  if (scheduleBeyondSession && access.canPost) {
    return (
      <NoticeShell variant={variant} tone="amber">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          {sessionEndsLabel
            ? `Posts after ${sessionEndsLabel} need a fresh LinkedIn sign-in. Pick an earlier date or reconnect LinkedIn.`
            : "That date is outside your current LinkedIn connection window. Pick an earlier date or sign in with LinkedIn again."}
        </p>
        <ShowMore
          expanded={expanded}
          onToggle={() => setExpanded(v => !v)}
          detail="Scheduling far ahead works only while your LinkedIn connection is active. Reconnecting LinkedIn extends that window."
          ctaLabel="Sign in with LinkedIn"
          onCta={() => {
            window.location.href = buildLinkedInConnectUrl(userId);
          }}
        />
      </NoticeShell>
    );
  }

  if (!access.blockReason) return null;

  const copy = COPY[access.blockReason];

  return (
    <NoticeShell variant={variant} tone="slate">
      <div className="flex gap-2">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
        <p className="text-sm text-slate-700 dark:text-slate-200">{copy.short}</p>
      </div>
      <ShowMore
        expanded={expanded}
        onToggle={() => setExpanded(v => !v)}
        detail={copy.detail}
        ctaLabel={copy.cta}
        onCta={() => {
          window.location.href = buildLinkedInConnectUrl(userId);
        }}
      />
    </NoticeShell>
  );
}

function NoticeShell({ children, variant, tone }: { children: React.ReactNode; variant: "inline" | "panel"; tone: "slate" | "amber" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30"
      : "border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/50";

  if (variant === "inline") {
    return <div className={`rounded-xl border px-3 py-2.5 shadow-lg ${toneClass}`}>{children}</div>;
  }

  return <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>{children}</div>;
}

function ShowMore({
  expanded,
  onToggle,
  detail,
  ctaLabel,
  onCta,
}: {
  expanded: boolean;
  onToggle: () => void;
  detail: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        {expanded ? "Show less" : "Show more"}
        <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded ? (
        <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{detail}</p>
          <button
            type="button"
            onClick={onCta}
            className="inline-flex items-center gap-2 rounded-full bg-[#0077B5] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#006097] active:scale-[0.99]"
          >
            <Linkedin size={14} aria-hidden />
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Wraps a disabled control with a hover/click popover the user can interact with. */
export function LinkedInPublishAccessTooltipWrap({
  access,
  userId,
  children,
  disabled,
}: {
  access: LinkedInPublishAccess;
  userId?: number;
  children: React.ReactNode;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const blocked = disabled && Boolean(access.blockReason);
  if (!blocked) {
    return <>{children}</>;
  }

  const show = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const hide = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <div
        onClick={e => {
          e.preventDefault();
          setOpen(value => !value);
        }}
      >
        {children}
      </div>
      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-0 w-72 pb-2" onMouseEnter={show} onMouseLeave={hide}>
          <LinkedInPublishAccessNotice access={access} userId={userId} variant="inline" />
        </div>
      ) : null}
    </div>
  );
}
