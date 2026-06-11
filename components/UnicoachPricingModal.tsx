"use client";

import React, { useEffect } from "react";
import { UnicoachSubscriptionCheckoutCard } from "@/components/unicoach/UnicoachSubscriptionCheckoutCard";
import confetti from "canvas-confetti";
import { Check, X } from "lucide-react";
import Script from "next/script";

export const OPEN_UNICOACH_PRICING_EVENT = "open-unicoach-pricing";
export const UNICOACH_PAYMENT_SUCCESS_EVENT = "unicoach-payment-success";

export function openUnicoachPricing() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_UNICOACH_PRICING_EVENT));
  }
}

const UNICOACH_BENEFITS = [
  { id: "journey", title: "4 calls + personal branding" },
  { id: "calls", title: "Four 1:1 coach calls" },
  { id: "niche", title: "Niche, resume & LinkedIn" },
  { id: "portfolio", title: "Portfolio & applications" },
  { id: "branding", title: "Branding & outreach" },
  { id: "interview", title: "Interview preparation" },
  { id: "chat", title: "Coach chat on every step" },
  { id: "progress", title: "Tasks & progress tracking" },
] as const;

type UnicoachPricingModalProps = {
  onClose: () => void;
  onPaymentSuccess?: () => void;
};

const firePricingConfetti = () => {
  const burst = (particleCount: number, spread: number, originY: number, delay = 0) => {
    window.setTimeout(() => {
      confetti({
        particleCount,
        spread,
        origin: { y: originY },
        ticks: 220,
        colors: ["#2563eb", "#346de0", "#22c55e", "#eab308", "#f8fafc"],
      });
    }, delay);
  };

  burst(120, 70, 0.35);
  burst(60, 100, 0.3, 150);
  confetti({
    particleCount: 35,
    spread: 120,
    origin: { y: 0.28 },
    angle: 90,
    shapes: ["star"],
    scalar: 0.85,
    colors: ["#eab308", "#fbbf24", "#2563eb"],
    ticks: 200,
  });
};

const UnicoachPricingModal: React.FC<UnicoachPricingModalProps> = ({ onClose, onPaymentSuccess }) => {
  useEffect(() => {
    firePricingConfetti();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handlePaymentSuccess = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(UNICOACH_PAYMENT_SUCCESS_EVENT));
    }
    onPaymentSuccess?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unicoach-pricing-title"
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Close pricing"
      >
        <X size={20} />
      </button>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 py-3 text-center sm:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Unicoach Premium</p>

          <h1
            id="unicoach-pricing-title"
            className="mt-3 text-3xl font-medium leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            Hire a coach. <span className="text-brand-600 dark:text-brand-400">Get hired faster.</span>
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            One payment · full journey · four live calls · personal branding · coach support throughout
          </p>

          <div className="mt-5 flex items-baseline justify-center gap-3">
            <span className="text-5xl font-semibold tracking-tight text-slate-400 line-through decoration-slate-400/80 decoration-2 dark:text-slate-500 sm:text-6xl">
              £199
            </span>
            <span className="text-5xl font-semibold tracking-tight text-brand-600 dark:text-brand-400 sm:text-6xl">Free</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">limited offer</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {["1:1 coaching", "4 live calls", "Personal branding"].map(tag => (
              <span key={tag} className="rounded-full border border-slate-200 bg-white px-3.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 w-full max-w-xl">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Everything included</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-left sm:gap-x-10 sm:gap-y-3">
              {UNICOACH_BENEFITS.map(({ id, title }) => (
                <li key={id} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200 sm:text-base">
                  <Check size={18} strokeWidth={2.5} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="leading-snug">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:py-5">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center">
          <UnicoachSubscriptionCheckoutCard variant="footer" onPaymentSuccess={handlePaymentSuccess} />
        </div>
      </footer>
    </div>
  );
};

export default UnicoachPricingModal;
