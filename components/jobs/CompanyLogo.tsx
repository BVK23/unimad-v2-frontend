"use client";

import { useState } from "react";
import Image from "next/image";

export type CompanyLogoSize = "xs" | "sm" | "md";

const SIZES: Record<CompanyLogoSize, { box: string; text: string; px: string }> = {
  xs: { box: "h-8 w-8 rounded-lg", text: "text-sm font-bold", px: "32px" },
  sm: { box: "h-12 w-12 rounded-xl", text: "text-lg font-bold", px: "48px" },
  md: { box: "h-16 w-16 rounded-2xl", text: "text-3xl font-bold", px: "64px" },
};

function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface CompanyLogoProps {
  logoUrl?: string | null;
  company: string;
  size?: CompanyLogoSize;
  className?: string;
}

export function CompanyLogo({ logoUrl, company, size = "sm", className = "" }: CompanyLogoProps) {
  const [logoError, setLogoError] = useState(false);
  const showFallback = !isValidUrl(logoUrl) || logoError;
  const { box, text, px } = SIZES[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${box} ${className}`}
    >
      {!showFallback ? (
        <Image src={logoUrl as string} alt={company} fill sizes={px} className="object-contain" onError={() => setLogoError(true)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500">
          <span className={`text-white ${text}`}>{company?.charAt(0)?.toUpperCase() || "?"}</span>
        </div>
      )}
    </div>
  );
}
