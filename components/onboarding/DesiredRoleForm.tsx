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

const MAX_ROLES = 3;

export default function DesiredRoleForm({ onComplete }: DesiredRoleFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [roles, setRoles] = useState<string[]>([]);
  const [manualRoles, setManualRoles] = useState<string[]>([]);
  const [hydratedFromStore, setHydratedFromStore] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const totalSelected = roles.length + manualRoles.length;
  const canAddMore = totalSelected < MAX_ROLES;

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

  useEffect(() => {
    if (hydratedFromStore) return;
    if (userOnboardingData.role.length === 0) {
      setHydratedFromStore(true);
      return;
    }
    if (suggestions.length === 0) return;

    const saved = userOnboardingData.role.slice(0, MAX_ROLES);
    setRoles(saved.filter(role => suggestions.includes(role)));
    setManualRoles(saved.filter(role => !suggestions.includes(role)));
    setHydratedFromStore(true);
  }, [hydratedFromStore, suggestions, userOnboardingData.role]);

  const toggleSuggestion = (suggestion: string) => {
    if (roles.includes(suggestion)) {
      setRoles(prev => prev.filter(role => role !== suggestion));
      return;
    }
    if (!canAddMore) {
      toast.error(`You can add up to ${MAX_ROLES} roles`);
      return;
    }
    setRoles(prev => [...prev, suggestion]);
  };

  const submitManual = () => {
    const trimmed = manualValue.trim();
    if (!trimmed) return;
    if (roles.includes(trimmed) || manualRoles.includes(trimmed)) {
      setManualValue("");
      return;
    }
    if (!canAddMore) {
      toast.error(`You can add up to ${MAX_ROLES} roles`);
      return;
    }
    setManualRoles(prev => [...prev, trimmed]);
    setManualValue("");
  };

  const removeManual = (value: string) => {
    setManualRoles(prev => prev.filter(role => role !== value));
  };

  const handleSubmit = async () => {
    const allRoles = [...roles, ...manualRoles];
    if (allRoles.length === 0) {
      toast.error("Please add at least one role");
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("desired_roles", { role: allRoles });
      setUserOnboardingData({ role: allRoles });
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
      <Heading subtitle={`Select up to ${MAX_ROLES} that are relevant.`}>Your desired role?</Heading>

      <p className="text-xs font-medium text-[#8896A8] -mt-2">
        {totalSelected} of {MAX_ROLES} selected
      </p>

      <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-[44rem] mt-2 min-h-[40px]">
        {isSuggestionsLoading && suggestions.length === 0 ? Array.from({ length: 11 }).map((_, i) => <ChipSkeleton key={i} />) : null}
        {suggestions.map(suggestion => (
          <Chip key={suggestion} label={suggestion} selected={roles.includes(suggestion)} onClick={() => toggleSuggestion(suggestion)} />
        ))}
      </div>

      <div className="w-full max-w-[34rem] mt-2">
        <TextField
          placeholder={canAddMore ? "Or you can type here" : "Maximum roles selected"}
          value={manualValue}
          disabled={!canAddMore}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitManual();
            }
          }}
        />
        {manualValue.trim().length > 0 && canAddMore ? (
          <p className="text-xs font-medium text-[#346DE0] mt-1.5">Press Enter to add role</p>
        ) : null}
      </div>

      {manualRoles.length > 0 ? (
        <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-[44rem]">
          {manualRoles.map(item => (
            <Chip key={item} label={item} selected onRemove={() => removeManual(item)} />
          ))}
        </div>
      ) : null}

      <PrimaryButton onClick={handleSubmit} disabled={manualValue.trim().length > 0} className="mt-3">
        Next
      </PrimaryButton>
    </FormShell>
  );
}
