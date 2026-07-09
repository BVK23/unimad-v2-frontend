"use client";

import React, { useEffect, useState } from "react";
import { HoverTooltip } from "@/components/ui/HoverTooltip";
import { ImageOff } from "lucide-react";

const STALE_IMAGE_TOOLTIP =
  "LinkedIn rotates image links over time, so previews from your last analysis may no longer load. Re-Analyze to refresh your photos and scores.";

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
      return (
        <HoverTooltip content={STALE_IMAGE_TOOLTIP} side="bottom" className="h-full w-full cursor-help">
          {fallback}
        </HoverTooltip>
      );
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
