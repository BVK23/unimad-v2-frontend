"use client";

import { useEffect, useState } from "react";
import { useUnicoachRazorpayCheckout } from "@/features/unicoach/hooks/use-unicoach-razorpay-checkout";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import Script from "next/script";

type MasterclassFullProgramPaymentModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MasterclassFullProgramPaymentModal({ open, onClose }: MasterclassFullProgramPaymentModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStatus();
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  const { basePrice, finalPrice, appliedCode, discountAmount, isProcessing, isValidatingCoupon, applyCoupon, startCheckout } =
    useUnicoachRazorpayCheckout({ isAuthenticated });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, isProcessing]);

  if (!open) return null;

  const handlePay = async () => {
    const result = await startCheckout();
    if (result?.ok && result.redirectTo) {
      onClose();
      router.push(result.redirectTo);
    }
  };

  const handleApplyCoupon = async () => {
    const result = await applyCoupon(couponInput);
    if (result.ok) {
      setCouponOpen(false);
      setCouponInput("");
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div
        className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="masterclass-payment-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#0a0f18]/80 backdrop-blur-sm"
          aria-hidden
          tabIndex={-1}
          onClick={isProcessing ? undefined : onClose}
        />

        <div className="masterclass-onboarding-modal relative z-10 w-full max-w-[440px] rounded-t-[18px] sm:rounded-[14px]">
          <button
            type="button"
            onClick={isProcessing ? undefined : onClose}
            className="absolute right-4 top-4 z-10 p-1.5 text-[#eaeaea]/40 transition-colors hover:text-[#eaeaea]/70"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
            <h2 id="masterclass-payment-title" className="text-[22px] font-medium tracking-[-0.44px] text-[#eaeaea]">
              Unicoach Full System
            </h2>
            <p className="mt-2 text-[13px] leading-normal tracking-[-0.26px] text-[#eaeaea]/65">
              {isAuthenticated
                ? "You're signed in — payment will activate Unicoach on your account."
                : "Pay now, then sign in to activate your programme."}
            </p>

            <div className="mt-6 rounded-[12px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#eaeaea]/45">One-time</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    {discountAmount > 0 ? (
                      <>
                        <span className="text-[15px] text-[#eaeaea]/40 line-through">£{basePrice}</span>
                        <span className="text-[32px] font-semibold tracking-[-0.64px] text-[#eaeaea]">£{finalPrice}</span>
                      </>
                    ) : (
                      <span className="text-[32px] font-semibold tracking-[-0.64px] text-[#eaeaea]">£{basePrice}</span>
                    )}
                  </div>
                </div>
                {appliedCode ? (
                  <span className="text-[12px] font-medium text-[#22c55e]">✓ {appliedCode}</span>
                ) : (
                  <button
                    type="button"
                    className="text-[12px] font-medium text-[#81aaff] underline-offset-2 hover:underline"
                    onClick={() => setCouponOpen(true)}
                    disabled={isProcessing}
                  >
                    Have a coupon?
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handlePay()}
                className="masterclass-blue-btn mt-5 w-full disabled:opacity-60"
              >
                <span className="relative z-10 px-2">
                  {isProcessing ? "Opening payment…" : `Pay £${discountAmount > 0 ? finalPrice : basePrice}`}
                </span>
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] tracking-[-0.22px] text-[#eaeaea]/45">
              All 4 modules · 1-on-1 mentorship · lifetime community access
            </p>
          </div>
        </div>

        {couponOpen ? (
          <div
            className="fixed inset-0 z-[111] flex items-center justify-center bg-black/50 p-4"
            onClick={e => e.target === e.currentTarget && setCouponOpen(false)}
          >
            <div className="w-full max-w-sm rounded-[12px] border border-white/10 bg-[#111820] p-5">
              <p className="mb-3 text-[14px] font-medium text-[#eaeaea]">Enter coupon code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && void handleApplyCoupon()}
                  placeholder="CODE"
                  className="masterclass-onboarding-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={isValidatingCoupon}
                  className="rounded-full bg-[#346de0] px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {isValidatingCoupon ? "…" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
