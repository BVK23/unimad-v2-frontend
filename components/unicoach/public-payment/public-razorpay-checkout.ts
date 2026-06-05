"use client";

import { publicCreateUnicoachOrder, publicVerifyUnicoachPayment } from "@/features/unicoach/api/public-unicoach-client";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const getPublicUnicoachRazorpayKey = (): string | null => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null;

export type PublicUnicoachRazorpayResult = { ok: true; claimToken: string } | { ok: false; message: string };

/**
 * Guest public checkout: no email/name prefill — Razorpay collects payer details.
 */
export async function startPublicUnicoachRazorpayPayment(params: {
  appliedDiscountCode: string | null;
  onPhase: (label: string) => void;
}): Promise<PublicUnicoachRazorpayResult> {
  const key = getPublicUnicoachRazorpayKey();
  if (!key) {
    return { ok: false, message: "Payment is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID)." };
  }
  if (typeof window === "undefined" || !window.Razorpay) {
    return { ok: false, message: "Payment script is still loading. Try again in a moment." };
  }

  params.onPhase("Creating order…");
  try {
    const orderData = await publicCreateUnicoachOrder({
      discountCode: params.appliedDiscountCode,
    });
    const claimToken = orderData.claim_token;

    return await new Promise<PublicUnicoachRazorpayResult>(resolve => {
      let settled = false;
      let paymentSucceeded = false;
      const finish = (result: PublicUnicoachRazorpayResult) => {
        if (settled) return;
        settled = true;
        params.onPhase("");
        resolve(result);
      };

      const options: Record<string, unknown> = {
        key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Unimad",
        description: "Unicoach Program",
        order_id: orderData.id,
        handler: async (response: Record<string, string>) => {
          params.onPhase("Verifying payment…");
          try {
            const verification = await publicVerifyUnicoachPayment(response, claimToken);
            if (verification.verified) {
              paymentSucceeded = true;
              finish({ ok: true, claimToken });
            } else {
              finish({ ok: false, message: verification.message ?? "Verification failed" });
            }
          } catch (e) {
            finish({ ok: false, message: e instanceof Error ? e.message : "Verification failed" });
          }
        },
        modal: {
          ondismiss: () => {
            if (paymentSucceeded) return;
            finish({ ok: false, message: "Payment cancelled" });
          },
        },
        theme: { color: "#346DE0" },
      };

      try {
        const Razorpay = window.Razorpay;
        if (!Razorpay) {
          finish({ ok: false, message: "Payment script is still loading. Try again in a moment." });
          return;
        }
        new Razorpay(options).open();
      } catch (e) {
        finish({ ok: false, message: e instanceof Error ? e.message : "Could not open checkout" });
      }
    });
  } catch (e) {
    params.onPhase("");
    return { ok: false, message: e instanceof Error ? e.message : "Could not start payment" };
  }
}
