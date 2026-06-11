"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const LinkedInOptimizeBanner: React.FC = () => {
  const router = useRouter();

  return (
    <div className="linkedin-optimize-banner relative overflow-hidden rounded-xl border border-brand-600/25 bg-brand-600">
      <span className="linkedin-optimize-shimmer pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Optimize your LinkedIn</p>
          <p className="text-xs text-white/80">Get profile tips, post ideas, and scheduling help from Unimad.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/uniboard/linkedin")}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-600 transition-opacity hover:opacity-90"
        >
          Get started
          <ArrowRight size={14} strokeWidth={2} className="fill-none" />
        </button>
      </div>

      <style jsx>{`
        .linkedin-optimize-shimmer {
          width: 40%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.08) 40%,
            rgba(255, 255, 255, 0.22) 50%,
            rgba(255, 255, 255, 0.08) 60%,
            transparent
          );
          transform: translateX(-160%) skewX(-12deg);
          animation: linkedinOptimizeShimmer 10s ease-in-out infinite;
        }

        @keyframes linkedinOptimizeShimmer {
          0%,
          84%,
          100% {
            transform: translateX(-160%) skewX(-12deg);
          }
          16% {
            transform: translateX(380%) skewX(-12deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LinkedInOptimizeBanner;
