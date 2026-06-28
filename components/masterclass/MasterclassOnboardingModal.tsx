"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type MasterclassOnboardingIntent = "booking" | "video";

export type MasterclassLead = {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  bookingMethod?: "form" | "google" | "linkedin";
};

type MasterclassOnboardingModalProps = {
  open: boolean;
  intent?: MasterclassOnboardingIntent;
  onClose: () => void;
  onSubmit: (lead: MasterclassLead) => void;
  onSocialBook: (provider: "google" | "linkedin") => void;
};

const ONBOARDING_COPY = {
  booking: {
    title: "Book your free onboarding call",
    description: "Share your details and we'll help you get started with the Unimad Career Positioning System.",
    submitLabel: "Continue to booking",
  },
  video: {
    title: "Sign in to watch",
    description: "Sign in to unlock the full masterclass preview and continue with your free onboarding call.",
    submitLabel: "Sign in to watch",
  },
} as const;

const COUNTRY_DIAL_CODES = [
  { code: "+44", country: "United Kingdom" },
  { code: "+1", country: "United States / Canada" },
  { code: "+91", country: "India" },
  { code: "+61", country: "Australia" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+65", country: "Singapore" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+353", country: "Ireland" },
  { code: "+31", country: "Netherlands" },
  { code: "+34", country: "Spain" },
  { code: "+39", country: "Italy" },
  { code: "+48", country: "Poland" },
  { code: "+60", country: "Malaysia" },
  { code: "+63", country: "Philippines" },
  { code: "+234", country: "Nigeria" },
  { code: "+27", country: "South Africa" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+86", country: "China" },
  { code: "+55", country: "Brazil" },
  { code: "+52", country: "Mexico" },
] as const;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export function MasterclassOnboardingModal({ open, intent = "booking", onClose, onSubmit, onSocialBook }: MasterclassOnboardingModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+44");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const copy = ONBOARDING_COPY[intent] ?? ONBOARDING_COPY.booking;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.replace(/\D/g, "");

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedPhone.length < 6) {
      setError("Please enter a valid phone number.");
      return;
    }

    onSubmit({
      name: trimmedName,
      email: trimmedEmail,
      dialCode,
      phone: trimmedPhone,
      bookingMethod: "form",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="masterclass-onboarding-title"
    >
      <button type="button" className="absolute inset-0 bg-[#0a0f18]/75 backdrop-blur-sm" aria-hidden tabIndex={-1} />

      <button
        type="button"
        onClick={onClose}
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[101] p-1.5 text-[#eaeaea]/40 transition-colors hover:text-[#eaeaea]/70 sm:right-5 sm:top-5"
        aria-label="Close"
      >
        <X size={16} strokeWidth={2} />
      </button>

      <div className="masterclass-onboarding-modal relative z-10 max-h-[min(92dvh,760px)] w-full max-w-[440px] overflow-y-auto rounded-t-[18px] sm:rounded-[14px]">
        <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pb-8 sm:pt-9">
          <h2
            id="masterclass-onboarding-title"
            className="text-[22px] font-medium leading-[1.2] tracking-[-0.44px] text-[#eaeaea] sm:text-[24px]"
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-[13px] leading-normal tracking-[-0.26px] text-[#eaeaea]/65">{copy.description}</p>

          <div className="mt-6 space-y-3">
            <button type="button" onClick={() => onSocialBook("google")} className="masterclass-social-btn">
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>
            <button type="button" onClick={() => onSocialBook("linkedin")} className="masterclass-social-btn">
              <LinkedInIcon />
              <span>Sign in with LinkedIn</span>
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium tracking-[-0.22px] text-[#eaeaea]/45">or enter your details</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="masterclass-name" className="masterclass-onboarding-label">
                Name
              </label>
              <input
                id="masterclass-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="masterclass-onboarding-input"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="masterclass-email" className="masterclass-onboarding-label">
                Email
              </label>
              <input
                id="masterclass-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="masterclass-onboarding-input"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="masterclass-phone" className="masterclass-onboarding-label">
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  id="masterclass-dial-code"
                  value={dialCode}
                  onChange={e => setDialCode(e.target.value)}
                  className="masterclass-onboarding-input masterclass-onboarding-select w-[118px] shrink-0 sm:w-[130px]"
                  aria-label="Country code"
                >
                  {COUNTRY_DIAL_CODES.map(({ code, country }) => (
                    <option key={code} value={code}>
                      {code} {country}
                    </option>
                  ))}
                </select>
                <input
                  id="masterclass-phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="masterclass-onboarding-input min-w-0 flex-1"
                />
              </div>
            </div>

            {error ? (
              <p className="text-[12px] leading-normal text-[#e35959]" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="masterclass-blue-btn masterclass-blue-btn--modal">
              <span className="relative z-10 px-2">{copy.submitLabel}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
