"use client";

import { useCallback, useMemo, useState } from "react";
import {
  publicCreateUnicoachOrder,
  publicValidateUnicoachDiscount,
  publicVerifyUnicoachPayment,
} from "@/features/unicoach/api/public-unicoach-client";
import {
  claimUnicoachPurchase,
  createUnicoachOrder,
  validateUnicoachDiscount,
  verifyUnicoachPayment,
} from "@/features/unicoach/server-actions/unicoach-actions";

function notifyError(message: string) {
  console.error(message);
}

function notifySuccess(message: string) {
  console.info(message);
}

export const UNICOACH_FULL_PROGRAM_PRICE = 199;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function useUnicoachRazorpayCheckout({ isAuthenticated = false }: { isAuthenticated?: boolean } = {}) {
  const [appliedCode, setAppliedCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const finalPrice = useMemo(() => Math.max(0, UNICOACH_FULL_PROGRAM_PRICE - discountAmount), [discountAmount]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const trimmed = (code || "").trim();
      if (!trimmed) return { ok: false as const };

      try {
        setIsValidatingCoupon(true);
        const result = isAuthenticated ? await validateUnicoachDiscount(trimmed) : await publicValidateUnicoachDiscount(trimmed);

        if (!result.valid) {
          notifyError(result.message || "Invalid coupon");
          return { ok: false as const };
        }

        setAppliedCode(trimmed.toUpperCase());
        setDiscountAmount(result.discount_amount ?? 0);
        return { ok: true as const };
      } catch {
        notifyError("Invalid coupon code");
        return { ok: false as const };
      } finally {
        setIsValidatingCoupon(false);
      }
    },
    [isAuthenticated]
  );

  const clearCoupon = useCallback(() => {
    setAppliedCode("");
    setDiscountAmount(0);
  }, []);

  const startCheckout = useCallback(async () => {
    if (typeof window === "undefined" || !window.Razorpay) {
      notifyError("Payment gateway failed to load. Please refresh and try again.");
      return { ok: false as const };
    }

    try {
      setIsProcessing(true);

      let orderData: { id: string; amount: number; currency: string };
      let guestClaimToken: string | null = null;

      if (isAuthenticated) {
        orderData = await createUnicoachOrder(appliedCode || null);
      } else {
        const publicOrder = await publicCreateUnicoachOrder({ discountCode: appliedCode || null });
        orderData = publicOrder;
        guestClaimToken = publicOrder.claim_token;
      }

      return await new Promise<{ ok: boolean; redirectTo?: string; cancelled?: boolean }>(resolve => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Unimad",
          description: "Unicoach Full Program",
          order_id: orderData.id,
          handler: async function (response: Record<string, string>) {
            try {
              if (isAuthenticated) {
                const verification = await verifyUnicoachPayment(response);
                if (!verification?.verified) {
                  notifyError("Payment verification failed");
                  resolve({ ok: false });
                  return;
                }
                notifySuccess("Welcome to Unicoach!");
                resolve({ ok: true, redirectTo: "/uniboard/unicoach" });
                return;
              }

              if (!guestClaimToken) {
                notifyError("Payment verification failed");
                resolve({ ok: false });
                return;
              }

              await publicVerifyUnicoachPayment(response, guestClaimToken);
              resolve({
                ok: true,
                redirectTo: `/signin?redirect=unicoach&unicoach_claim=${encodeURIComponent(guestClaimToken)}`,
              });
            } catch {
              notifyError("Payment verification failed");
              resolve({ ok: false });
            }
          },
          modal: {
            ondismiss: function () {
              notifyError("Payment cancelled");
              resolve({ ok: false, cancelled: true });
            },
          },
          theme: { color: "#346DE0" },
        };

        const Razorpay = window.Razorpay;
        if (!Razorpay) {
          resolve({ ok: false });
          return;
        }
        new Razorpay(options).open();
      });
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Failed to start payment");
      return { ok: false as const };
    } finally {
      setIsProcessing(false);
    }
  }, [appliedCode, isAuthenticated]);

  const claimPendingPurchase = useCallback(async (claimToken: string) => {
    if (!claimToken) return { ok: false as const };
    try {
      await claimUnicoachPurchase(claimToken);
      return { ok: true as const, redirectTo: "/uniboard/unicoach" };
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Failed to link payment to your account");
      return { ok: false as const };
    }
  }, []);

  return {
    basePrice: UNICOACH_FULL_PROGRAM_PRICE,
    finalPrice,
    appliedCode,
    discountAmount,
    isProcessing,
    isValidatingCoupon,
    applyCoupon,
    clearCoupon,
    startCheckout,
    claimPendingPurchase,
  };
}
