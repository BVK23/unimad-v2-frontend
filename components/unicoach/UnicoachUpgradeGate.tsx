"use client";

import { useCallback, useEffect, useState } from "react";
import UnicoachPricingModal, { OPEN_UNICOACH_PRICING_EVENT } from "@/components/UnicoachPricingModal";
import { Circle, Lock, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { UNICOACH_STAGES } from "./curriculum";

type UnicoachUpgradeGateProps = {
  onEnrollmentComplete?: () => void;
  userName?: string;
  userEmail?: string;
};

export const UnicoachUpgradeGate = ({ onEnrollmentComplete, userName, userEmail }: UnicoachUpgradeGateProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const openPricing = useCallback(() => setPricingOpen(true), []);
  const closePricing = useCallback(() => {
    setPricingOpen(false);
    if (searchParams?.get("book") === "discovery") {
      router.replace("/uniboard/unicoach", { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    const onOpen = () => openPricing();
    window.addEventListener(OPEN_UNICOACH_PRICING_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_UNICOACH_PRICING_EVENT, onOpen);
  }, [openPricing]);

  useEffect(() => {
    if (searchParams?.get("book") !== "discovery") return;
    queueMicrotask(() => openPricing());
  }, [searchParams, openPricing]);

  const previewStages = UNICOACH_STAGES.slice(0, 4);
  const activeStage = previewStages[0];

  return (
    <>
      <div className="relative flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-hidden">
        <div
          className={`scrollbar-on-hover h-full overflow-y-auto ${isOverlayDismissed ? "" : "pointer-events-none select-none"}`}
          aria-hidden={!isOverlayDismissed}
        >
          <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
            <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-2xl lg:text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">
                    Your Unicoach Journey
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                    5 steps stand between you and your offer. Complete each one to level up and win this job search game.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] sm:max-w-none sm:w-[200px] lg:w-auto lg:max-w-none">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Progress</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">0%</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Coaching sessions</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">0/4</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <aside className="lg:col-span-3 space-y-2">
                {previewStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`w-full rounded-xl border p-3 ${
                      stage.id === activeStage.id
                        ? "border-brand-200 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111]"
                    } ${index > 0 ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {index > 0 ? (
                          <Lock size={16} className="text-slate-400" aria-hidden />
                        ) : (
                          <Circle size={16} className="text-brand-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Stage {index + 1}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{stage.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </aside>

              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Overview</p>
                  <h2 className="text-lg font-medium text-slate-900 dark:text-white mt-1">{activeStage.overview[0]?.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{activeStage.overview[0]?.body}</p>
                  <div className="mt-4 space-y-3">
                    {activeStage.overview.slice(1, 3).map(section => (
                      <div
                        key={section.title}
                        className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{section.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{section.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="lg:col-span-3">
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Task checklist</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">One-time milestones for this module.</p>
                  <div className="mt-4 space-y-3">
                    {activeStage.tasks.map(task => (
                      <label key={task} className="flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 opacity-60 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          readOnly
                          className="h-4 w-4 min-h-4 min-w-4 shrink-0 rounded border-slate-300 text-brand-600 mt-0.5 disabled:opacity-50"
                        />
                        <span className="leading-5 text-slate-700 dark:text-slate-300">{task}</span>
                      </label>
                    ))}
                  </div>
                  {isOverlayDismissed ? (
                    <button
                      type="button"
                      onClick={openPricing}
                      className="mt-3 w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 transition-all active:scale-[0.99] shadow-sm shadow-brand-500/20"
                    >
                      Book your strategy call
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-3 w-full rounded-xl bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 text-sm font-semibold py-2.5"
                    >
                      Book next call
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>

        {!isOverlayDismissed ? (
          <div className="absolute inset-0 z-[120]">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/35 via-white/65 to-white/85 dark:from-black/30 dark:via-black/55 dark:to-black/72 backdrop-blur-[2px]" />
            <button
              type="button"
              onClick={() => setIsOverlayDismissed(true)}
              className="absolute right-4 top-4 z-[60] pointer-events-auto h-9 w-9 rounded-full border border-white/70 dark:border-white/20 bg-white/80 dark:bg-black/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-black/70 transition-colors inline-flex items-center justify-center"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center p-6">
              <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-[0_16px_60px_rgba(15,23,42,0.12)] dark:border-slate-200 dark:bg-white">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Hire a coach</p>
                <h3 className="mt-2 text-2xl font-medium text-slate-900">Upgrade to Unicoach</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Start your Unicoach journey and get your end-to-end job search strategy
                </p>
                <button
                  type="button"
                  onClick={openPricing}
                  className="mt-5 pointer-events-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                >
                  Book your strategy call
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <UnicoachPricingModal
        open={pricingOpen}
        onClose={closePricing}
        onPaymentSuccess={onEnrollmentComplete}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
};
