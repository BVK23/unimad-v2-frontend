"use client";

import React, { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
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

const inputClassName =
  "flex-1 min-w-0 rounded-[10px] border border-[rgba(12,15,26,0.07)] bg-white px-4 py-3 text-sm text-[#0C0F1A] placeholder:text-[#8896A8] focus:outline-none focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/30";

const countrySelectClassName =
  "rounded-[10px] border border-[rgba(12,15,26,0.07)] bg-white px-2 py-3 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0]";

export default function WhatsAppForm({ onComplete }: WhatsAppFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [whatsAppNumber, setWhatsAppNumber] = useState<string | undefined>(userOnboardingData.phoneNumber || undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!whatsAppNumber || !isValidPhoneNumber(whatsAppNumber)) {
      setError("Invalid phone number");
      return;
    }
    setError(null);
    try {
      setLoading("Saving your number…");
      await saveOnboardingData("whatsapp", { whatsapp_number: whatsAppNumber });
      setUserOnboardingData({ phoneNumber: whatsAppNumber });
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

      <div className="w-full mt-2 [&_.PhoneInput]:flex [&_.PhoneInput]:w-full [&_.PhoneInput]:items-stretch [&_.PhoneInput]:gap-2">
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry="IN"
          value={whatsAppNumber}
          onChange={value => {
            setWhatsAppNumber(value);
            if (error) setError(null);
          }}
          className="w-full"
          numberInputProps={{
            className: error ? `${inputClassName} border-rose-300` : inputClassName,
            placeholder: "Phone number",
          }}
          countrySelectProps={{
            className: countrySelectClassName,
          }}
        />
      </div>

      {error ? <p className="text-xs text-rose-600 self-start">{error}</p> : null}

      <PrimaryButton onClick={handleSubmit} className="mt-3">
        Next
      </PrimaryButton>
    </FormShell>
  );
}
