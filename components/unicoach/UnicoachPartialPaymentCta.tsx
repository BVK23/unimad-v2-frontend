"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Script from "next/script";
import { startUnicoachRazorpayPayment } from "./unicoach-razorpay-checkout";

export const UnicoachPartialPaymentCta = () => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState("");
  const [banner, setBanner] = useState("");

  const handlePayRemaining = async () => {
    setBanner("");
    const result = await startUnicoachRazorpayPayment({
      kind: "remaining",
      discountCode: null,
      discountApplied: false,
      onPhase: setPhase,
    });
    setPhase("");
    if (result.ok) {
      void queryClient.invalidateQueries({ queryKey: ["unicoach", "init"] });
      void queryClient.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
      void queryClient.invalidateQueries({ queryKey: ["unicoach", "profile-info"] });
    } else if (result.message.includes("closed before")) {
      setBanner("");
    } else {
      setBanner(result.message);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-900 dark:text-amber-100 min-w-0 flex-1">
          You are on partial access. Later journey stages stay locked until you complete the remaining payment (second half of your plan).
        </p>
        <button
          type="button"
          onClick={() => void handlePayRemaining()}
          disabled={Boolean(phase)}
          className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-60"
        >
          {phase || "Pay remaining balance"}
        </button>
      </div>
      {banner ? (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300" role="alert">
          {banner}
        </p>
      ) : null}
    </>
  );
};
