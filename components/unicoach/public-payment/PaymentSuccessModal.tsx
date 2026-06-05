"use client";

import { useCallback, useEffect } from "react";

const POST_PAYMENT_REDIRECT_SECONDS = 5;

type PaymentSuccessModalProps = {
  onRedirect: () => void;
};

export function PaymentSuccessModal({ onRedirect }: PaymentSuccessModalProps) {
  const handleRedirect = useCallback(() => {
    onRedirect();
  }, [onRedirect]);

  useEffect(() => {
    const timer = setTimeout(handleRedirect, POST_PAYMENT_REDIRECT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [handleRedirect]);

  return (
    <div className="payment-success-overlay" role="dialog" aria-modal="true" aria-labelledby="payment-success-title">
      <div className="payment-success-box">
        <div className="payment-success-icon" aria-hidden>
          ✓
        </div>
        <h2 id="payment-success-title" className="payment-success-title">
          Payment verified
        </h2>
        <p className="payment-success-text">
          Your Unicoach payment was successful. Next, sign in or create your Unimad account to activate your programme.
        </p>
        <p className="payment-success-sub">Redirecting to sign in in {POST_PAYMENT_REDIRECT_SECONDS} seconds…</p>
        <div className="payment-success-bar-track">
          <div className="payment-success-bar-fill" style={{ animationDuration: `${POST_PAYMENT_REDIRECT_SECONDS}s` }} />
        </div>
        <button type="button" className="payment-success-skip" onClick={handleRedirect}>
          Continue now →
        </button>
      </div>
    </div>
  );
}
