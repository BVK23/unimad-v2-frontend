"use client";

import {
  createUnicoachOrder,
  fetchUserDataForPaymentPrefill,
  verifyUnicoachPayment,
} from "@/features/unicoach/server-actions/unicoach-actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const getUnicoachRazorpayKey = (): string | null => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null;

export type UnicoachPaymentKind = "subscribe" | "remaining";

export type UnicoachRazorpayResult = { ok: true } | { ok: false; message: string };

/**
 * Creates a Razorpay order, opens checkout, verifies signature on success.
 * `onPhase` receives empty string when clearing (e.g. modal dismissed).
 */
export const startUnicoachRazorpayPayment = async (params: {
  kind: UnicoachPaymentKind;
  discountCode: string | null;
  discountApplied: boolean;
  onPhase: (label: string) => void;
}): Promise<UnicoachRazorpayResult> => {
  const key = getUnicoachRazorpayKey();
  if (!key) {
    return { ok: false, message: "Payment is not configured (missing NEXT_PUBLIC_RAZORPAY_KEY_ID)." };
  }
  if (typeof window === "undefined" || !window.Razorpay) {
    return { ok: false, message: "Payment script is still loading. Try again in a moment." };
  }

  params.onPhase("Creating order…");
  try {
    const orderOptions = params.kind === "remaining" ? { isRemainingPartialPayment: true as const } : ({} as Record<string, never>);
    const codeForOrder =
      params.kind === "subscribe" && params.discountApplied && params.discountCode?.trim() ? params.discountCode.trim() : null;
    const orderData = await createUnicoachOrder(codeForOrder, orderOptions);
    const prefill = await fetchUserDataForPaymentPrefill();

    return await new Promise<UnicoachRazorpayResult>(resolve => {
      let settled = false;
      let paymentSucceeded = false;
      const finish = (result: UnicoachRazorpayResult) => {
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
        description: params.kind === "remaining" ? "Unicoach — remaining balance" : "Unicoach Program",
        order_id: orderData.id,
        handler: async (response: Record<string, string>) => {
          params.onPhase("Verifying payment…");
          try {
            const verification = await verifyUnicoachPayment(response);
            if (verification.verified) {
              paymentSucceeded = true;
              finish({ ok: true });
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
            finish({ ok: false, message: "Payment window closed before completion." });
          },
        },
        prefill: {
          name: prefill.fullName ?? prefill.firstName ?? "Unimad User",
          email: prefill.email ?? "",
        },
        theme: { color: "#346DE0" },
      };

      try {
        const Razorpay = window.Razorpay;
        if (!Razorpay) {
          params.onPhase("");
          finish({ ok: false, message: "Payment script is still loading. Try again in a moment." });
          return;
        }
        const razorpay = new Razorpay(options);
        razorpay.open();
      } catch (e) {
        params.onPhase("");
        finish({ ok: false, message: e instanceof Error ? e.message : "Could not open checkout" });
      }
    });
  } catch (e) {
    params.onPhase("");
    return { ok: false, message: e instanceof Error ? e.message : "Could not start payment" };
  }
};
