"use client";

import { useState } from "react";
import { validateUnicoachDiscount } from "@/features/unicoach/server-actions/unicoach-actions";
import { getUnicoachRazorpayKey, startUnicoachRazorpayPayment } from "./unicoach-razorpay-checkout";

export type UnicoachSubscriptionCheckoutCardProps = {
  onPaymentSuccess: () => void;
};

export const UnicoachSubscriptionCheckoutCard = ({ onPaymentSuccess }: UnicoachSubscriptionCheckoutCardProps) => {
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isDiscountValid, setIsDiscountValid] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [payPhase, setPayPhase] = useState("");
  const [banner, setBanner] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);

  const basePrice = 199;
  const finalPrice = basePrice - discountAmount;
  const razorpayConfigured = Boolean(getUnicoachRazorpayKey());

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

  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:p-6 shadow-sm h-fit">
      <h2 className="text-lg font-medium text-slate-900 dark:text-white">Checkout</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Pay securely in GBP. Your coach and journey unlock after confirmation.
      </p>

      {!razorpayConfigured ? (
        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Payment is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID). Add it to your environment to enable checkout.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 min-w-[7rem]">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Program</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">£{basePrice}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 min-w-[7rem]">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">You pay</p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">£{finalPrice}</p>
        </div>
      </div>

      {isDiscountValid ? <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">Discount code applied.</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="unicoach-discount" className="text-xs text-slate-500 dark:text-slate-400">
            Discount code (optional)
          </label>
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
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="Enter code"
          />
          {discountError ? <p className="text-xs text-red-600 mt-1">{discountError}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void handleValidateDiscount()}
          disabled={isValidating || !discountCode.trim()}
          className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {isValidating ? "Checking…" : "Apply code"}
        </button>
      </div>

      {banner ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400" role="alert">
          {banner}
        </p>
      ) : null}

      {successFlash ? (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
          Payment confirmed — loading your journey…
        </p>
      ) : null}

      {payPhase ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
          {payPhase}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={isBusy || !razorpayConfigured || successFlash}
        className="mt-5 w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {payPhase || "Pay securely"}
      </button>
    </div>
  );
};
