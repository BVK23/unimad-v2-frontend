"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import TextField from "./shared/TextField";
import { useShowToast } from "./shared/Toast";

type LinkedInFormProps = {
  onComplete: () => void;
};

const validateLinkedInUrl = (raw: string): string | null => {
  if (!raw.trim()) return "LinkedIn URL is required";
  try {
    const url = new URL(raw);
    if (!url.hostname.includes("linkedin.com")) {
      return "Please enter a valid LinkedIn URL";
    }
    return null;
  } catch {
    return "Please enter a valid URL";
  }
};

export default function LinkedInForm({ onComplete }: LinkedInFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [linkedinUrl, setLinkedinUrl] = useState(userOnboardingData.linkedinUrl);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLinkedInUrl(linkedinUrl);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);

    try {
      setLoading(true);
      await saveOnboardingData("linkedin_url", { linkedin_url: linkedinUrl.trim() });
      setUserOnboardingData({ linkedinUrl: linkedinUrl.trim() });
      onComplete();
    } catch (err) {
      console.error("Error saving LinkedIn URL", err);
      toast.error("Failed to save LinkedIn URL");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell as="form" onSubmit={handleSubmit} width="narrow">
      <Heading>Enter your LinkedIn URL</Heading>
      <TextField
        type="url"
        autoFocus
        placeholder="https://www.linkedin.com/in/your-profile"
        value={linkedinUrl}
        invalid={Boolean(error)}
        helperText={error ?? undefined}
        onChange={e => {
          setLinkedinUrl(e.target.value);
          if (error) setError(null);
        }}
        containerClassName="w-full mt-2"
      />
      <PrimaryButton type="submit" className="mt-3">
        Next
      </PrimaryButton>
    </FormShell>
  );
}
