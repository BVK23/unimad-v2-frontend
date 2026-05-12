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

type NameFormProps = {
  onComplete: () => void;
};

export default function NameForm({ onComplete }: NameFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [name, setName] = useState(userOnboardingData.name);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await saveOnboardingData("preferred_name", { preferred_name: name.trim() });
      setUserOnboardingData({ name: name.trim() });
      onComplete();
    } catch (err) {
      console.error("Error saving name", err);
      toast.error("Failed to save name");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell as="form" onSubmit={handleSubmit} width="narrow">
      <Heading>Your preferred name?</Heading>
      <TextField
        placeholder="Name"
        autoFocus
        required
        value={name}
        invalid={Boolean(error)}
        helperText={error ?? undefined}
        onChange={e => {
          setName(e.target.value);
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
