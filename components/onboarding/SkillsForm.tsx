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

type SkillsFormProps = {
  onComplete: () => void;
};

const MIN_SKILLS = 3;

export default function SkillsForm({ onComplete }: SkillsFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [skills, setSkills] = useState<string[]>(userOnboardingData.skills);
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [manualValue, setManualValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsSuggestionsLoading(true);
        const res = await getSuggestions("onboarding_skill");
        if (!cancelled) setSuggestions(res.data ?? []);
      } catch (err) {
        console.error("Error fetching skill suggestions", err);
      } finally {
        if (!cancelled) setIsSuggestionsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSuggestion = (suggestion: string) => {
    setSkills(prev => (prev.includes(suggestion) ? prev.filter(s => s !== suggestion) : [...prev, suggestion]));
  };

  const submitManual = () => {
    const trimmed = manualValue.trim();
    if (!trimmed) return;
    setManualSkills(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setManualValue("");
  };

  const removeManual = (value: string) => {
    setManualSkills(prev => prev.filter(s => s !== value));
  };

  const handleSubmit = async () => {
    const all = [...skills, ...manualSkills];
    if (all.length < MIN_SKILLS) {
      toast.error(`Please add at least ${MIN_SKILLS} skills`);
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("skills", { skills: all });
      setUserOnboardingData({ skills: all });
      onComplete();
    } catch (err) {
      console.error("Error saving skills", err);
      toast.error("Failed to save skills");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell width="wide">
      <Heading subtitle="Select all that apply.">Add your skills</Heading>

      <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-[44rem] mt-2 min-h-[40px]">
        {isSuggestionsLoading && suggestions.length === 0 ? Array.from({ length: 12 }).map((_, i) => <ChipSkeleton key={i} />) : null}
        {suggestions.map(suggestion => (
          <Chip key={suggestion} label={suggestion} selected={skills.includes(suggestion)} onClick={() => toggleSuggestion(suggestion)} />
        ))}
      </div>

      <div className="w-full max-w-[34rem] mt-2">
        <TextField
          placeholder="Or you can type here"
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitManual();
            }
          }}
        />
        {manualValue.trim().length > 0 ? <p className="text-xs font-medium text-[#346DE0] mt-1.5">Press Enter to add skill</p> : null}
      </div>

      {manualSkills.length > 0 ? (
        <div className="flex flex-wrap gap-2.5 items-center justify-center w-full max-w-[44rem]">
          {manualSkills.map(item => (
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
