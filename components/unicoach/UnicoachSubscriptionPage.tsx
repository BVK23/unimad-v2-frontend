"use client";

import { CheckCircle2, Sparkles, Star } from "lucide-react";
import Script from "next/script";
import { UnicoachSubscriptionCheckoutCard } from "./UnicoachSubscriptionCheckoutCard";

type UnicoachSubscriptionPageProps = {
  onPaymentSuccess: () => void;
};

const VALUE_BULLETS = [
  "Six-stage journey with clear tasks and progress tracked on the server",
  "Coach chat tied to each stage, with the same sections your coach already uses",
  "Per-coach booking links for Call 1–3 (no hardcoded Calendly in the client)",
  "Stage unlock rules and partial-access handling aligned with your subscription",
] as const;

export const UnicoachSubscriptionPage = ({ onPaymentSuccess }: UnicoachSubscriptionPageProps) => {
  return (
    <div className="scrollbar-on-hover flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Subscribe</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mt-1">
            <div>
              <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium">Unicoach Journey</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
                Join the full program to unlock your guided path, coach messaging, and call scheduling. One payment for the complete
                experience.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto lg:max-w-xl">
              {[
                { label: "From", value: "£199" },
                { label: "Format", value: "1:1" },
                { label: "Calls", value: "3" },
                { label: "Checkout", value: "Razorpay" },
              ].map(chip => (
                <div
                  key={chip.label}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-slate-50/80 dark:bg-slate-900/40"
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{chip.label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{chip.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500 shrink-0" />
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">What you get</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {VALUE_BULLETS.map(line => (
                  <li key={line} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-[#111]/80 px-4 py-3 flex items-center gap-3">
              <Star size={18} className="text-amber-500 shrink-0" fill="currentColor" aria-hidden />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                After payment you&apos;ll land on the same journey layout with your stages, tasks, and coach chat — no separate app to
                learn.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5">
            <UnicoachSubscriptionCheckoutCard onPaymentSuccess={onPaymentSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};
