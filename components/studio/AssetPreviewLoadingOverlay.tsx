"use client";

interface AssetPreviewLoadingOverlayProps {
  label?: string;
}

export default function AssetPreviewLoadingOverlay({ label = "Generating draft..." }: AssetPreviewLoadingOverlayProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white dark:bg-[#111]">
      <div className="absolute inset-0 p-6 md:p-12">
        <div className="space-y-5 animate-pulse">
          {/* Subject */}
          <div className="space-y-2">
            <div className="h-5 w-64 rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>

          {/* Paragraphs */}
          <div className="space-y-3">
            <div className="h-5 w-full rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-5 w-[88%] rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-5 w-[92%] rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>

          <div className="space-y-2">
            <div className="h-5 w-64 rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>

          {/* Bullet list block */}
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

          {/* Closing lines */}
          <div className="space-y-3 pt-1">
            <div className="h-5 w-[90%] rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-5 w-24 rounded bg-slate-200/80 dark:bg-slate-800" />
            <div className="h-5 w-20 rounded bg-slate-200/80 dark:bg-slate-800" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-slate-500/10 to-transparent animate-pulse" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      </div>
    </div>
  );
}
