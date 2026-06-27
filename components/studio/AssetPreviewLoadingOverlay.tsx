"use client";

export type AssetPreviewLoadingVariant = "skeleton" | "spinner";

interface AssetPreviewLoadingOverlayProps {
  label?: string;
  /** skeleton = first-time draft (shimmer only); spinner = update/refine over existing content */
  variant?: AssetPreviewLoadingVariant;
}

const SkeletonLines = () => (
  <div className="space-y-5 animate-pulse">
    <div className="space-y-2">
      <div className="h-5 w-64 rounded bg-slate-200/80 dark:bg-slate-800" />
    </div>
    <div className="space-y-2">
      <div className="h-5 w-28 rounded bg-slate-200/80 dark:bg-slate-800" />
    </div>
    <div className="space-y-3">
      <div className="h-5 w-full rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-5 w-[88%] rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-5 w-[92%] rounded bg-slate-200/80 dark:bg-slate-800" />
    </div>
    <div className="space-y-2">
      <div className="h-5 w-64 rounded bg-slate-200/80 dark:bg-slate-800" />
    </div>
    <div className="space-y-3 pl-2">
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="h-5 w-[82%] rounded bg-slate-200/80 dark:bg-slate-800" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="h-5 w-[78%] rounded bg-slate-200/80 dark:bg-slate-800" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div className="h-5 w-[84%] rounded bg-slate-200/80 dark:bg-slate-800" />
      </div>
    </div>
    <div className="space-y-3 pt-1">
      <div className="h-5 w-[90%] rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-5 w-24 rounded bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-5 w-20 rounded bg-slate-200/80 dark:bg-slate-800" />
    </div>
  </div>
);

export default function AssetPreviewLoadingOverlay({
  label = "Generating draft...",
  variant = "skeleton",
}: AssetPreviewLoadingOverlayProps) {
  if (variant === "spinner") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-600" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-[#111]">
      <div className="absolute inset-0 p-6 md:p-12">
        <SkeletonLines />
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-slate-500/10" />
      </div>
    </div>
  );
}
