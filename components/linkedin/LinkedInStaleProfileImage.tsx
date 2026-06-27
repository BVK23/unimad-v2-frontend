"use client";

import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

const STALE_IMAGE_TOOLTIP =
  "LinkedIn rotates image links over time, so previews from your last analysis may no longer load. Re-Analyze to refresh your photos and scores.";

function StaleImageTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="group/stale-img relative h-full w-full cursor-help" title={STALE_IMAGE_TOOLTIP}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute top-full left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-[11px] leading-snug text-white opacity-0 shadow-xl transition-all group-hover/stale-img:visible group-hover/stale-img:opacity-100"
      >
        {STALE_IMAGE_TOOLTIP}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
      </div>
    </div>
  );
}

type LinkedInStaleProfileImageProps = {
  src: string | null | undefined;
  alt: string;
  variant: "cover" | "profile";
  className?: string;
  fallbackLabel?: string;
};

export function LinkedInStaleProfileImage({
  src,
  alt,
  variant,
  className = "h-full w-full object-cover",
  fallbackLabel,
}: LinkedInStaleProfileImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset image error when src changes
    setFailed(false);
  }, [src]);

  const trimmedSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : null;
  const shapeClass = variant === "profile" ? "overflow-hidden rounded-full" : "overflow-hidden rounded-lg";

  if (!trimmedSrc || failed) {
    const fallback =
      variant === "cover" ? (
        <div className={`flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 ${shapeClass}`}>
          <ImageOff size={20} className="text-slate-400" aria-hidden />
          <span className="sr-only">{alt} unavailable</span>
        </div>
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 ${shapeClass}`}>
          <span className="text-2xl font-medium text-slate-400">{(fallbackLabel || "me").slice(0, 2).toLowerCase()}</span>
          <span className="sr-only">{alt} unavailable</span>
        </div>
      );

    if (trimmedSrc && failed) {
      return <StaleImageTooltip>{fallback}</StaleImageTooltip>;
    }

    return fallback;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={trimmedSrc}
      alt={alt}
      className={`${className} ${shapeClass}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
