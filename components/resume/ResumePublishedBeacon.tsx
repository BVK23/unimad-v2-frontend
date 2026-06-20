"use client";

import React from "react";

type ResumePublishedBeaconProps = {
  className?: string;
  /** Include screen-reader label when used without visible "Published" text. */
  label?: string;
};

/** Small green live indicator — matches portfolio published beacon. */
export function ResumePublishedBeacon({ className = "", label = "Published" }: ResumePublishedBeaconProps) {
  return (
    <span className={`relative inline-flex h-2 w-2 shrink-0 ${className}`} title={label} aria-label={label}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" aria-hidden />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.85)]" aria-hidden />
    </span>
  );
}

export default ResumePublishedBeacon;
