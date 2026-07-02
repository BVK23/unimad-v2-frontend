"use client";

import React from "react";

const ShimmerBone = ({ className }: { className: string }) => <div className={`resume-card-skeleton-bone ${className}`} />;

const ResumeCardSkeleton: React.FC = () => (
  <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-hidden>
    <ShimmerBone className="h-40 w-full rounded-none" />
    <div className="space-y-2 p-4">
      <ShimmerBone className="h-4 w-3/4 rounded" />
      <ShimmerBone className="h-3 w-1/2 rounded" />
    </div>
  </div>
);

const RESUME_SKELETON_COUNT = 5;

export function ResumeCardsLoadingSkeletons() {
  return (
    <>
      {Array.from({ length: RESUME_SKELETON_COUNT }).map((_, index) => (
        <ResumeCardSkeleton key={`resume-skeleton-${index}`} />
      ))}
    </>
  );
}

export function ResumeCardSkeletonStyles() {
  return (
    <style jsx global>{`
      .resume-card-skeleton-bone {
        position: relative;
        overflow: hidden;
        background: rgb(226 232 240);
      }

      .resume-card-skeleton-bone::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.35) 45%,
          rgba(255, 255, 255, 0.65) 50%,
          rgba(255, 255, 255, 0.35) 55%,
          transparent 100%
        );
        animation: resumeCardShimmer 1.4s ease-in-out infinite;
      }

      @keyframes resumeCardShimmer {
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  );
}

export default ResumeCardSkeleton;
