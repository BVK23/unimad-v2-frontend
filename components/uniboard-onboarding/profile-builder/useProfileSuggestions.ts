"use client";

import { useEffect, useState } from "react";
import { getSuggestions, type SuggestionType } from "@/lib/actions/onboardingActions";
import { useOnboardingSuggestionsStore, type OnboardingSuggestionType } from "./useOnboardingSuggestionsStore";

const SECTION_TO_KV: Record<SuggestionType, OnboardingSuggestionType | null> = {
  onboarding_education: "course_name",
  onboarding_experience: "job_role",
  onboarding_project: "project_title",
  onboarding_skill: null,
  onboarding_strength: null,
  onboarding_desired_role: null,
};

const API_FIELD: Record<OnboardingSuggestionType, string> = {
  course_name: "course_name",
  job_role: "job_role",
  project_title: "project_title",
  skill: "skill",
};

export function useProfileSuggestions(type: SuggestionType, triggerValue: string, minLength = 2) {
  const kvType = SECTION_TO_KV[type];
  const getCached = useOnboardingSuggestionsStore(s => s.getCached);
  const setCached = useOnboardingSuggestionsStore(s => s.setCached);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = triggerValue.trim();
    if (!kvType || trimmed.length < minLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const cached = getCached(kvType, trimmed);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getSuggestions(type, { [API_FIELD[kvType]]: trimmed });
        const data = res.data ?? [];
        if (!cancelled) {
          setSuggestions(data);
          if (data.length) setCached(kvType, trimmed, data);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [type, triggerValue, kvType, minLength, getCached, setCached]);

  return { suggestions, loading };
}
