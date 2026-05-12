"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import { CheckCircle2 } from "lucide-react";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import { useShowToast } from "./shared/Toast";

type GoalFormProps = {
  onComplete: () => void;
};

const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: "full_time_job", label: "Full-time job" },
  { value: "personal_branding", label: "Personal branding" },
  { value: "build_a_portfolio", label: "Building my portfolio" },
  { value: "switch_careers", label: "Looking to switch careers" },
];

export default function GoalForm({ onComplete }: GoalFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [goals, setGoals] = useState<string[]>(userOnboardingData.goal);

  const toggle = (value: string) => {
    setGoals(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (goals.length === 0) {
      toast.error("Please select at least one goal");
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("goal", { goal: goals });
      setUserOnboardingData({ goal: goals });
      onComplete();
    } catch (err) {
      console.error("Error saving goal", err);
      toast.error("Failed to save goal");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell width="narrow">
      <Heading>Your goal?</Heading>

      <div className="flex flex-col gap-2.5 w-full mt-2">
        {GOAL_OPTIONS.map(opt => {
          const selected = goals.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-3 px-5 py-4 rounded-[12px] border text-sm font-medium transition-colors ${
                selected
                  ? "bg-[#F0F6FE] border-[#346DE0] text-[#0C0F1A]"
                  : "bg-white border-[rgba(12,15,26,0.07)] text-[#4A5568] hover:border-[#346DE0]/40"
              }`}
            >
              <CheckCircle2 size={18} className={selected ? "text-[#346DE0]" : "text-[#D1D5DB]"} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <PrimaryButton onClick={handleSubmit} className="mt-4">
        Complete
      </PrimaryButton>
    </FormShell>
  );
}
