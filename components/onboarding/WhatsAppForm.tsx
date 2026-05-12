"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import { useShowToast } from "./shared/Toast";

type WhatsAppFormProps = {
  onComplete: () => void;
};

/**
 * Country dial codes for the most common Unimad audiences. Keep this list short
 * and serializable; if needed we can swap for a richer list later.
 */
const COUNTRY_CODES: { code: string; label: string; dial: string }[] = [
  { code: "IN", label: "India", dial: "+91" },
  { code: "US", label: "United States", dial: "+1" },
  { code: "GB", label: "United Kingdom", dial: "+44" },
  { code: "CA", label: "Canada", dial: "+1" },
  { code: "AU", label: "Australia", dial: "+61" },
  { code: "AE", label: "UAE", dial: "+971" },
  { code: "SG", label: "Singapore", dial: "+65" },
  { code: "DE", label: "Germany", dial: "+49" },
  { code: "FR", label: "France", dial: "+33" },
  { code: "BR", label: "Brazil", dial: "+55" },
];

const splitStored = (stored: string): { dial: string; rest: string } => {
  if (!stored) return { dial: "+91", rest: "" };
  const matched = COUNTRY_CODES.find(c => stored.startsWith(c.dial));
  if (matched) return { dial: matched.dial, rest: stored.slice(matched.dial.length).replace(/[^\d]/g, "") };
  if (stored.startsWith("+")) {
    const m = stored.match(/^\+(\d{1,4})/);
    if (m) return { dial: `+${m[1]}`, rest: stored.slice(m[0].length).replace(/[^\d]/g, "") };
  }
  return { dial: "+91", rest: stored.replace(/[^\d]/g, "") };
};

const isLikelyValid = (dial: string, rest: string) => {
  // Most national subscriber numbers fall into 6-15 digits per E.164.
  return rest.length >= 6 && rest.length <= 15 && /^\+\d{1,4}$/.test(dial);
};

export default function WhatsAppForm({ onComplete }: WhatsAppFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const initial = splitStored(userOnboardingData.phoneNumber);
  const [dial, setDial] = useState(initial.dial);
  const [number, setNumber] = useState(initial.rest);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const composed = `${dial}${number}`;
    if (!isLikelyValid(dial, number)) {
      setError("Invalid phone number");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await saveOnboardingData("whatsapp", { whatsapp_number: composed });
      setUserOnboardingData({ phoneNumber: composed });
      onComplete();
    } catch (err) {
      console.error("Error saving phone number", err);
      toast.error("Failed to save number");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell width="narrow">
      <Heading subtitle="Only for job updates — no spam, no fluff!">Your WhatsApp number?</Heading>

      <div className="w-full mt-2 flex items-stretch gap-2">
        <select
          aria-label="Country code"
          value={dial}
          onChange={e => setDial(e.target.value)}
          className="rounded-[10px] border border-[rgba(12,15,26,0.07)] bg-white px-3 py-3 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0]"
        >
          {COUNTRY_CODES.map(c => (
            <option key={`${c.code}${c.dial}`} value={c.dial}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          placeholder="Phone number"
          value={number}
          onChange={e => {
            setNumber(e.target.value.replace(/[^\d]/g, ""));
            if (error) setError(null);
          }}
          className={`flex-1 rounded-[10px] border bg-white px-4 py-3 text-sm text-[#0C0F1A] placeholder:text-[#8896A8] focus:outline-none focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/30 ${
            error ? "border-rose-300" : "border-[rgba(12,15,26,0.07)]"
          }`}
        />
      </div>

      {error ? <p className="text-xs text-rose-600 self-start">{error}</p> : null}

      <PrimaryButton onClick={handleSubmit} className="mt-3">
        Next
      </PrimaryButton>
    </FormShell>
  );
}
