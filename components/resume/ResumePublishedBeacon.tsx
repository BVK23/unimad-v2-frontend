"use client";

import React, { useMemo, useState } from "react";

type ResumePublishedBeaconProps = {
  className?: string;
  /** Include screen-reader label when used without visible "Published" text. */
  label?: string;
  /** ISO date / Date — shown in hover tooltip as "Published @ 17 July 26". */
  publishedAt?: string | Date | null;
  /** Show the richer tooltip (date + live-changes note). */
  showTooltip?: boolean;
};

function formatPublishedAtLabel(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = String(date.getFullYear()).slice(-2);
  return `Published @ ${day} ${month} ${year}`;
}

/** Small green live indicator — matches portfolio published beacon. */
export function ResumePublishedBeacon({
  className = "",
  label = "Published",
  publishedAt = null,
  showTooltip = true,
}: ResumePublishedBeaconProps) {
  const [open, setOpen] = useState(false);
  const publishedLine = useMemo(() => formatPublishedAtLabel(publishedAt) ?? "Published", [publishedAt]);

  return (
    <span
      className={`relative inline-flex h-2 w-2 shrink-0 ${className}`}
      title={showTooltip ? undefined : label}
      aria-label={label}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" aria-hidden />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.85)]" aria-hidden />
      {showTooltip && open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-[200] mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-100">{publishedLine}</span>
          <span className="mt-0.5 block text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            Recent changes will also be reflected
          </span>
        </span>
      ) : null}
    </span>
  );
}

export default ResumePublishedBeacon;
