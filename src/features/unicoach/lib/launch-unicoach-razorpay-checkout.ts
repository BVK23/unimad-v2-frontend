import { getUnicoachPlan, type UnicoachProductPlanId } from "@/constants/unicoach-plans";
import {
  publicCreateUnicoachOrder,
  publicValidateUnicoachDiscount,
  publicVerifyUnicoachPayment,
} from "@/features/unicoach/api/public-unicoach-client";
import { createUnicoachOrder, validateUnicoachDiscount, verifyUnicoachPayment } from "@/features/unicoach/server-actions/unicoach-actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export type LaunchUnicoachCheckoutResult = { ok: true; redirectTo?: string } | { ok: false; cancelled?: boolean; message?: string };

/**
 * Creates a Razorpay order for a Unicoach plan and opens checkout directly.
 * Coupons are only applied for plans that allow them (Full System).
 */
export async function launchUnicoachRazorpayCheckout(params: {
  isAuthenticated: boolean;
  planId: UnicoachProductPlanId;
  discountCode?: string | null;
  onPhase?: (label: string) => void;
}): Promise<LaunchUnicoachCheckoutResult> {
  const plan = getUnicoachPlan(params.planId);
  const onPhase = params.onPhase ?? (() => undefined);

  if (typeof window === "undefined" || !window.Razorpay) {
    return { ok: false, message: "Payment script is still loading. Try again in a moment." };
  }

  let appliedCode: string | null = null;
  const rawCode = (params.discountCode || "").trim();
  if (rawCode) {
    if (!plan.allowsCoupon) {
      return { ok: false, message: "Coupons apply to the Full System only." };
    }
    onPhase("Validating coupon…");
    try {
      const result = params.isAuthenticated ? await validateUnicoachDiscount(rawCode) : await publicValidateUnicoachDiscount(rawCode);
      if (!result.valid) {
        return { ok: false, message: result.message || "Invalid coupon" };
      }
      appliedCode = rawCode.toUpperCase();
    } catch {
      return { ok: false, message: "Invalid coupon code" };
    }
  }

  onPhase("Creating order…");
  try {
    let orderData: { id: string; amount: number; currency: string };
    let guestClaimToken: string | null = null;
    const orderOptions = {
      planId: params.planId,
      discountCode: plan.allowsCoupon ? appliedCode : null,
    };

    if (params.isAuthenticated) {
      orderData = await createUnicoachOrder(orderOptions.discountCode, orderOptions);
    } else {
      const publicOrder = await publicCreateUnicoachOrder(orderOptions);
      orderData = publicOrder;
      guestClaimToken = publicOrder.claim_token;
    }

    return await new Promise<LaunchUnicoachCheckoutResult>(resolve => {
      let settled = false;
      const finish = (result: LaunchUnicoachCheckoutResult) => {
        if (settled) return;
        settled = true;
        onPhase("");
        resolve(result);
      };

      const options: Record<string, unknown> = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Unimad",
        description: plan.description,
        order_id: orderData.id,
        handler: async (response: Record<string, string>) => {
          onPhase("Verifying payment…");
          try {
            if (params.isAuthenticated) {
              const verification = await verifyUnicoachPayment(response);
              if (!verification?.verified) {
                finish({ ok: false, message: "Payment verification failed" });
                return;
              }
              finish({ ok: true, redirectTo: "/uniboard/unicoach" });
              return;
            }

            if (!guestClaimToken) {
              finish({ ok: false, message: "Payment verification failed" });
              return;
            }

            await publicVerifyUnicoachPayment(response, guestClaimToken);
            finish({
              ok: true,
              redirectTo: `/signin?redirect=unicoach&unicoach_claim=${encodeURIComponent(guestClaimToken)}`,
            });
          } catch {
            finish({ ok: false, message: "Payment verification failed" });
          }
        },
        modal: {
          ondismiss: () => finish({ ok: false, cancelled: true, message: "Payment window closed before completion." }),
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
    onPhase("");
    return { ok: false, message: e instanceof Error ? e.message : "Could not start payment" };
  }
}
