"use client";

import { useState } from "react";
import { validateUnicoachDiscount } from "@/features/unicoach/server-actions/unicoach-actions";
import { getUnicoachRazorpayKey, startUnicoachRazorpayPayment } from "./unicoach-razorpay-checkout";

export type UnicoachSubscriptionCheckoutCardProps = {
  onPaymentSuccess: () => void;
  /** Centered footer bar on the pricing page */
  variant?: "card" | "footer";
};

export const UnicoachSubscriptionCheckoutCard = ({ onPaymentSuccess, variant = "card" }: UnicoachSubscriptionCheckoutCardProps) => {
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isDiscountValid, setIsDiscountValid] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [payPhase, setPayPhase] = useState("");
  const [banner, setBanner] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);

  const basePrice = 199;
  const finalPrice = basePrice - discountAmount;
  const razorpayConfigured = Boolean(getUnicoachRazorpayKey());
  const isFooter = variant === "footer";

  const handleValidateDiscount = async () => {
    setIsValidating(true);
    setDiscountError("");
    try {
      const result = await validateUnicoachDiscount(discountCode.trim());
      if (result.valid) {
        setDiscountAmount(result.discount_amount ?? 0);
        setIsDiscountValid(true);
      } else {
        setDiscountAmount(0);
        setIsDiscountValid(false);
        setDiscountError(result.message ?? "Invalid code");
      }
    } catch (e) {
      setDiscountAmount(0);
      setIsDiscountValid(false);
      setDiscountError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePay = async () => {
    setBanner("");
    setSuccessFlash(false);
    const result = await startUnicoachRazorpayPayment({
      kind: "subscribe",
      discountCode,
      discountApplied: isDiscountValid,
      onPhase: setPayPhase,
    });
    setPayPhase("");
    if (result.ok) {
      setSuccessFlash(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1200);
    } else {
      const msg = "message" in result ? result.message : "Payment failed";
      if (msg.includes("closed before") || msg.includes("cancelled")) {
        setBanner("");
      } else {
        setBanner(msg);
      }
    }
  };

  const isBusy = Boolean(payPhase);

  const discountBlock = (
    <div className={isFooter ? "w-full" : "mt-4"}>
      {!isFooter ? (
        <label htmlFor="unicoach-discount" className="text-xs text-slate-500 dark:text-slate-400">
          Discount code (optional)
        </label>
      ) : null}
      {(showDiscount || !isFooter) && (
        <div className={`flex flex-col gap-2 ${isFooter ? "items-center" : "sm:flex-row sm:items-end"}`}>
          <div className={isFooter ? "w-full" : "flex-1"}>
            {!isFooter ? null : (
              <label htmlFor="unicoach-discount" className="sr-only">
                Discount code
              </label>
            )}
            <input
              id="unicoach-discount"
              value={discountCode}
              onChange={e => {
                setDiscountCode(e.target.value);
                if (isDiscountValid) {
                  setIsDiscountValid(false);
                  setDiscountAmount(0);
                  setDiscountError("");
                }
              }}
              className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-center outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 ${isFooter ? "" : "mt-1"}`}
              placeholder="Enter discount code"
            />
            {discountError ? <p className={`mt-1 text-xs text-red-600 ${isFooter ? "text-center" : ""}`}>{discountError}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => void handleValidateDiscount()}
            disabled={isValidating || !discountCode.trim()}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-base"
          >
            {isValidating ? "Checking…" : "Apply"}
          </button>
        </div>
      )}
      {isDiscountValid ? (
        <p className={`mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 ${isFooter ? "text-center" : ""}`}>
          Discount applied — you save £{discountAmount}
        </p>
      ) : null}
    </div>
  );

  const statusMessages = (
    <>
      {!razorpayConfigured && !isFooter ? (
        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Payment is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID). Add it to your environment to enable checkout.
        </div>
      ) : null}
      {banner ? (
        <p className={`text-sm text-amber-700 dark:text-amber-400 sm:text-base ${isFooter ? "mt-2 text-center" : "mt-3"}`} role="alert">
          {banner}
        </p>
      ) : null}
      {successFlash ? (
        <p
          className={`text-sm font-medium text-emerald-700 dark:text-emerald-400 sm:text-base ${isFooter ? "mt-2 text-center" : "mt-3"}`}
          role="status"
        >
          Payment confirmed — loading your journey…
        </p>
      ) : null}
      {payPhase ? (
        <p
          className={`text-sm text-slate-600 dark:text-slate-400 sm:text-base ${isFooter ? "mt-2 text-center" : "mt-3"}`}
          aria-live="polite"
        >
          {payPhase}
        </p>
      ) : null}
    </>
  );

  const payButton = (
    <button
      type="button"
      onClick={() => void handlePay()}
      disabled={isBusy || !razorpayConfigured || successFlash}
      className={
        isFooter
          ? "w-full max-w-md animate-cta-glow rounded-2xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          : "mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {payPhase || (isFooter ? "Get Unicoach for free" : `Pay £${finalPrice} securely`)}
    </button>
  );

  if (isFooter) {
    return (
      <div className="relative flex w-full flex-col items-center">
        {showDiscount ? (
          <div className="absolute bottom-full left-1/2 z-10 mb-3 w-full max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {discountBlock}
          </div>
        ) : null}
        {statusMessages}
        <div className="flex w-full flex-col items-center">{payButton}</div>
        <button
          type="button"
          onClick={() => setShowDiscount(v => !v)}
          className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 sm:text-sm"
        >
          {showDiscount ? "Hide discount code" : "Have a discount code?"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Secure checkout · unlocks instantly</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-sm h-fit">
      <h2 className="text-lg font-medium text-slate-900 dark:text-white">Checkout</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Pay securely in GBP. Your coach and journey unlock after confirmation.
      </p>
      {statusMessages}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 min-w-[7rem]">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Program</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">£{basePrice}</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2 min-w-[7rem] dark:border-brand-800/50 dark:bg-brand-950/30">
          <p className="text-[10px] uppercase tracking-wide text-brand-600 dark:text-brand-400">You pay</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">£{finalPrice}</p>
        </div>
      </div>
      {discountBlock}
      {payButton}
      <p className="mt-2 text-center text-[10px] text-slate-500 dark:text-slate-400">One-time payment · Full program access</p>
    </div>
  );
};
