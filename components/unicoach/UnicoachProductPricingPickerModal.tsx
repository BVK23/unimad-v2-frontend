"use client";

import { useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { UNICOACH_PLANS, type UnicoachProductPlanId } from "@/constants/unicoach-plans";
import { launchUnicoachRazorpayCheckout } from "@/features/unicoach/lib/launch-unicoach-razorpay-checkout";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const PRODUCT_CARDS: {
  planId: UnicoachProductPlanId;
  features: string[];
  highlight?: boolean;
  ribbon?: string;
}[] = [
  {
    planId: "unicoach_call_2",
    features: ["DP, Headline, About", "Cover photo designed", "Monthly content engine", "Comments strategy", "Recruiter outbound"],
  },
  {
    planId: "unicoach_call_3",
    features: ["Tailored applications", "Daily application system", "Referral mastery", "Cold emails", "Portfolio building"],
  },
  {
    planId: "unicoach_call_4",
    features: ["Interview prep prompts", "STAR methodologies", "Value Proposition Doc", "30-60-90 plans", "Sponsorship negotiation"],
  },
  {
    planId: "unicoach_program",
    features: ["All 4 modules", "1-on-1 mentorship", "Lifetime community", "Exclusive webinars", "24×7 coach support"],
    highlight: true,
    ribbon: "Best value",
  },
];

type UnicoachProductPricingPickerModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** When true, emphasize remaining partial payment instead of module cards. */
  remainingPartialOnly?: boolean;
  onRemainingPartial?: () => void;
  remainingPending?: boolean;
};

export function UnicoachProductPricingPickerModal({
  open,
  onClose,
  title = "Continue your Unicoach programme",
  subtitle = "Start free with a discovery call. Add the modules you need — or take the full system.",
  remainingPartialOnly = false,
  onRemainingPartial,
  remainingPending = false,
}: UnicoachProductPricingPickerModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStatus();
  const [couponCode, setCouponCode] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [processingPlan, setProcessingPlan] = useState<UnicoachProductPlanId | null>(null);
  const [phase, setPhase] = useState("");

  if (!open) return null;

  const isBusy = Boolean(processingPlan) || remainingPending;

  const resetAndClose = () => {
    if (isBusy) return;
    setCouponCode("");
    setCheckoutError("");
    setProcessingPlan(null);
    setPhase("");
    onClose();
  };

  const handleCheckout = async (planId: UnicoachProductPlanId) => {
    if (isBusy) return;
    setCheckoutError("");
    setProcessingPlan(planId);
    const result = await launchUnicoachRazorpayCheckout({
      isAuthenticated: Boolean(isAuthenticated),
      planId,
      discountCode: planId === "unicoach_program" ? couponCode : null,
      onPhase: setPhase,
    });
    setProcessingPlan(null);
    setPhase("");
    if (result.ok) {
      setCouponCode("");
      setCheckoutError("");
      onClose();
      if (result.redirectTo) router.push(result.redirectTo);
      return;
    }
    if (!result.cancelled && result.message) {
      setCheckoutError(result.message);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <ModalPortalOverlay
        open={open}
        className="flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        role="presentation"
        onClick={isBusy ? undefined : resetAndClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unicoach-product-picker-title"
          className="relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#111] sm:rounded-2xl sm:p-8"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={isBusy ? undefined : resetAndClose}
            disabled={isBusy}
            className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <h2 id="unicoach-product-picker-title" className="pr-8 text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

          {remainingPartialOnly ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm text-amber-950 dark:text-amber-100">
                You&apos;ve paid the first installment. Complete the remaining balance to unlock Application Strategy and Interview Prep.
              </p>
              <button
                type="button"
                disabled={remainingPending}
                onClick={() => onRemainingPartial?.()}
                className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {remainingPending ? "Opening payment…" : "Pay remaining balance"}
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRODUCT_CARDS.map(card => {
                const plan = UNICOACH_PLANS[card.planId];
                const cardBusy = processingPlan === card.planId;
                return (
                  <article
                    key={card.planId}
                    className={`relative flex flex-col rounded-2xl border p-4 ${
                      card.highlight
                        ? "border-brand-300 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-950/20"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40"
                    }`}
                  >
                    {card.ribbon ? (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {card.ribbon}
                      </span>
                    ) : null}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{plan.label}</h3>
                    <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {card.features.map(f => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">£{plan.priceGbp}</p>
                    {card.highlight ? (
                      <div className="mt-2">
                        <label className="sr-only" htmlFor="unicoach-picker-coupon">
                          Coupon code
                        </label>
                        <input
                          id="unicoach-picker-coupon"
                          type="text"
                          value={couponCode}
                          disabled={isBusy}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Coupon code (optional)"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleCheckout(card.planId)}
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium disabled:opacity-60 ${
                        card.highlight
                          ? "bg-brand-600 text-white hover:bg-brand-700"
                          : "border border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cardBusy ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {phase || "Opening…"}
                        </>
                      ) : card.highlight ? (
                        "Sign Up"
                      ) : (
                        "Book Call"
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {checkoutError ? <p className="mt-4 text-center text-sm text-red-600">{checkoutError}</p> : null}
        </div>
      </ModalPortalOverlay>
    </>
  );
}
