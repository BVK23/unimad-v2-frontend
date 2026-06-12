"use client";

const bone = "bg-slate-200/80 dark:bg-slate-800 rounded animate-pulse";

const ContactRowSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_auto_auto] gap-2 items-center">
    <div className={`h-9 ${bone}`} />
    <div className={`h-9 ${bone}`} />
    <div className={`h-9 ${bone}`} />
    <div className={`h-9 w-9 ${bone}`} />
    <div className={`h-9 w-9 ${bone}`} />
  </div>
);

export default function PortfolioCreatingLayoutSkeleton() {
  return (
    <div className="pointer-events-none flex-1 overflow-y-auto bg-slate-50 dark:bg-[#080808] no-scrollbar" aria-hidden>
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className={`aspect-[4/1] w-full rounded-t-2xl border border-slate-200 dark:border-white/5 ${bone}`} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-40">
        <div className="relative mb-16 flex flex-col items-center text-center bg-white dark:bg-[#080808] border border-slate-200 dark:border-white/5 border-t-0 rounded-b-2xl px-6 md:px-10 pb-12 pt-0">
          <div
            className={`relative z-10 -mt-16 md:-mt-20 h-32 w-32 md:h-36 md:w-36 shrink-0 rounded-full border-4 border-white dark:border-[#080808] ${bone}`}
          />

          <div className="mt-8 w-full max-w-2xl flex flex-col items-center gap-3">
            <div className={`h-9 w-56 md:w-72 ${bone}`} />
            <div className={`h-4 w-40 ${bone}`} />
          </div>

          <div className="w-full max-w-2xl mt-10 flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-4">
              <div className={`h-9 w-24 rounded-lg ${bone}`} />
              <div className={`h-9 w-24 rounded-lg ${bone}`} />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 w-full space-y-2">
              <ContactRowSkeleton />
              <ContactRowSkeleton />
              <div className={`mx-auto mt-1 h-4 w-36 ${bone}`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative min-h-[280px]">
          <div className="col-span-1 md:col-span-12 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#080808] p-6 md:p-8 space-y-4">
            <div className={`h-5 w-40 ${bone}`} />
            <div className="space-y-3">
              <div className={`h-4 w-full ${bone}`} />
              <div className={`h-4 w-[92%] ${bone}`} />
              <div className={`h-4 w-[85%] ${bone}`} />
            </div>
          </div>

          <div className="col-span-1 md:col-span-6 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#080808] overflow-hidden">
            <div className={`h-36 md:h-40 w-full ${bone} rounded-none`} />
            <div className="p-6 md:p-8 space-y-3">
              <div className={`h-5 w-28 ${bone}`} />
              <div className={`h-3 w-full ${bone}`} />
              <div className={`h-3 w-[80%] ${bone}`} />
            </div>
          </div>

          <div className="col-span-1 md:col-span-6 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#080808] overflow-hidden">
            <div className={`h-36 md:h-40 w-full ${bone} rounded-none`} />
            <div className="p-6 md:p-8 space-y-3">
              <div className={`h-5 w-28 ${bone}`} />
              <div className={`h-3 w-full ${bone}`} />
              <div className={`h-3 w-[75%] ${bone}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
