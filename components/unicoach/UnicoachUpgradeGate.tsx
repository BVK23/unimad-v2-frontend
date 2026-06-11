"use client";

import { useEffect } from "react";
import { openUnicoachPricing, UNICOACH_PAYMENT_SUCCESS_EVENT } from "@/components/UnicoachPricingModal";
import { Circle, Lock, Star } from "lucide-react";
import { UNICOACH_STAGES } from "./curriculum";

type UnicoachUpgradeGateProps = {
  onPaymentSuccess: () => void;
};

export const UnicoachUpgradeGate = ({ onPaymentSuccess }: UnicoachUpgradeGateProps) => {
  useEffect(() => {
    const onSuccess = () => onPaymentSuccess();
    window.addEventListener(UNICOACH_PAYMENT_SUCCESS_EVENT, onSuccess);
    return () => window.removeEventListener(UNICOACH_PAYMENT_SUCCESS_EVENT, onSuccess);
  }, [onPaymentSuccess]);

  const previewStages = UNICOACH_STAGES.slice(0, 4);
  const activeStage = previewStages[0];

  return (
    <div className="relative flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-hidden">
      <div className="h-full overflow-y-auto pointer-events-none select-none" aria-hidden>
        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium mt-1">Unicoach Journey</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  No stage skipping. Complete mandatory tasks to unlock the next stage.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Program Progress</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">12%</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calls Completed</p>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">0/3</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative flex h-10 w-full items-center">
                <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-[12%] rounded-full bg-brand-600 dark:bg-brand-500" />
                </div>
                {([1, 2, 3] as const).map((call, i) => (
                  <div
                    key={call}
                    className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${[18, 50, 82][i]}%` }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm ring-2 ring-white dark:border-slate-600 dark:bg-slate-800 dark:ring-[#111]">
                      <Star size={15} className="text-slate-300 dark:text-slate-500" strokeWidth={1.75} />
                    </div>
                  </div>
                ))}
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

            <div className="lg:col-span-9 space-y-4">
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Overview</p>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mt-1">{activeStage.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{activeStage.subtitle}</p>
                <div className="mt-4 space-y-3">
                  {activeStage.overview.slice(0, 2).map(section => (
                    <div
                      key={section.title}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{section.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{section.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Coach chat</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 max-w-[85%]">
                    Welcome to Unicoach — your coach will guide you through each stage here.
                  </div>
                  <div className="rounded-xl bg-brand-50 dark:bg-brand-950/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 max-w-[75%] ml-auto">
                    Ready to start Call 1 prep?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-[120]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/35 via-white/65 to-white/85 dark:from-black/30 dark:via-black/55 dark:to-black/72 backdrop-blur-[2px]" />
        <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-[0_16px_60px_rgba(15,23,42,0.12)] dark:border-slate-200 dark:bg-white">
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Unicoach Premium</p>
            <h3 className="mt-2 text-2xl font-medium text-slate-900">Unlock Unicoach for free</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Unicoach pairs you with a coach for four live calls, personal branding, and a guided path from niche to interviews — free for
              7 days.
            </p>
            <button
              type="button"
              onClick={openUnicoachPricing}
              className="mt-5 pointer-events-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
            >
              Start 7-day free trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
