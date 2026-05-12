"use client";

import React, { useEffect, useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import { getSuggestions, saveOnboardingData } from "@/lib/actions/onboardingActions";
import Chip, { ChipSkeleton } from "./shared/Chip";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import TextField from "./shared/TextField";
import { useShowToast } from "./shared/Toast";

type DesiredRoleFormProps = {
  onComplete: () => void;
};

export default function DesiredRoleForm({ onComplete }: DesiredRoleFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [manualRole, setManualRole] = useState<string>(userOnboardingData.role[0] ?? "");
  const [manualInput, setManualInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsSuggestionsLoading(true);
        const res = await getSuggestions("onboarding_desired_role");
        if (!cancelled) setSuggestions(res.data ?? []);
      } catch (err) {
        console.error("Error fetching role suggestions", err);
      } finally {
        if (!cancelled) setIsSuggestionsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    const finalRole = selectedRole || manualRole;
    if (!finalRole) {
      toast.error("Please add at least one role");
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("desired_roles", { role: [finalRole] });
      setUserOnboardingData({ role: [finalRole] });
      onComplete();
    } catch (err) {
      console.error("Error saving role", err);
      toast.error("Failed to save role");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell width="wide">
      <Heading subtitle="Select one that's relevant.">Your desired role?</Heading>

      <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-[44rem] mt-2 min-h-[40px]">
        {isSuggestionsLoading && suggestions.length === 0 ? Array.from({ length: 11 }).map((_, i) => <ChipSkeleton key={i} />) : null}
        {suggestions.map(suggestion => (
          <Chip
            key={suggestion}
            label={suggestion}
            selected={selectedRole === suggestion}
            onClick={() => {
              if (selectedRole === suggestion) {
                setSelectedRole("");
                return;
              }
              setManualRole("");
              setSelectedRole(suggestion);
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-[34rem]">
        <TextField
          placeholder="Or you can type here"
          value={manualInput}
          onChange={e => setManualInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              const trimmed = manualInput.trim();
              if (!trimmed) return;
              setManualRole(trimmed);
              setSelectedRole("");
              setManualInput("");
            }
          }}
        />
        {manualInput.trim().length > 0 ? <p className="text-xs font-medium text-[#346DE0] mt-1.5">Press Enter to add role</p> : null}
      </div>

      {manualRole ? (
        <div className="self-start">
          <Chip label={manualRole} selected onRemove={() => setManualRole("")} />
        </div>
      ) : null}

      <PrimaryButton onClick={handleSubmit} disabled={manualInput.trim().length > 0} className="mt-3">
        Next
      </PrimaryButton>
    </FormShell>
  );
}
