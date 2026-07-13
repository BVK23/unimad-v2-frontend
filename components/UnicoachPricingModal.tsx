"use client";

import React, { useEffect } from "react";
import { useUnicoachDiscoveryBooking } from "@/components/unicoach/use-unicoach-discovery-booking";
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
  { id: "role", title: "Role Clarity" },
  { id: "cv", title: "ATS-proof CV" },
  { id: "linkedin", title: "Optimised LinkedIn" },
  { id: "portfolio", title: "A functional portfolio" },
  { id: "branding", title: "Personal branding strategy" },
  { id: "applications", title: "Quality Applications framework" },
  { id: "interview", title: "Interview prep & Value Prop docs" },
] as const;

type UnicoachPricingModalProps = {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  userName?: string;
  userEmail?: string;
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

const UnicoachPricingModal: React.FC<UnicoachPricingModalProps> = ({ open, onClose, onPaymentSuccess, userName, userEmail }) => {
  const { startDiscoveryForm, discoveryOverlay, isDiscoveryActive, isResolving } = useUnicoachDiscoveryBooking({
    userName,
    userEmail,
    open,
    onComplete: () => {
      onPaymentSuccess?.();
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    firePricingConfetti();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDiscoveryActive) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, isDiscoveryActive]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 font-sans text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unicoach-pricing-title"
      >
        <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />

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
              Get hired faster with Unicoach
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              90% of our students land interviews in less than 30 days.
            </p>

            <div className="mt-5 flex flex-wrap items-baseline justify-center gap-3">
              <span className="text-5xl font-semibold tracking-tight text-slate-400 line-through decoration-slate-400/80 decoration-2 dark:text-slate-500 sm:text-6xl">
                £199
              </span>
              <span className="text-5xl font-semibold tracking-tight text-brand-600 dark:text-brand-400 sm:text-6xl">Free to Start</span>
              <span
                style={{
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  background: "rgba(251, 245, 183, 0.08)",
                  padding: "2px 8px",
                  fontSize: "0.75rem",
                  color: "#B38728",
                  borderRadius: "9999px",
                }}
              >
                Limited offer
              </span>
            </div>

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">4 live calls · 1-1 Coaching · 24/7 Support</div>

            <div className="mt-6 w-full max-w-xl">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400">All deliverables done for you.</h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-left sm:gap-x-10 sm:gap-y-3">
                {UNICOACH_BENEFITS.map(({ id, title }) => (
                  <li key={id} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200 sm:text-base">
                    <Check size={18} strokeWidth={2.5} className="shrink-0 text-[#D4AF37]" aria-hidden />
                    <span className="leading-snug">{title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 sm:py-5">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center">
            <button
              type="button"
              onClick={() => void startDiscoveryForm()}
              disabled={isResolving}
              className="w-full max-w-md rounded-2xl px-8 py-4 text-base font-semibold transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70 sm:text-lg"
              style={{
                background: "linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)",
                color: "#0F172A",
                boxShadow: "0 10px 25px -5px rgba(187, 137, 34, 0.35), 0 8px 10px -6px rgba(187, 137, 34, 0.25)",
              }}
            >
              {isResolving ? "Checking your details…" : "Start Unicoach for Free"}
            </button>
          </div>
        </footer>
      </div>

      {discoveryOverlay}
    </>
  );
};

export default UnicoachPricingModal;
