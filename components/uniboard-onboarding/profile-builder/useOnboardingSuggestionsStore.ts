"use client";

import { create } from "zustand";

export type OnboardingSuggestionType = "course_name" | "job_role" | "project_title" | "skill";

type SuggestionsKv = Record<OnboardingSuggestionType, Record<string, string[]>>;

type OnboardingSuggestionsStore = {
  suggestionsKv: SuggestionsKv;
  normalizeKey: (key: string) => string;
  getCached: (type: OnboardingSuggestionType, key: string) => string[] | null;
  setCached: (type: OnboardingSuggestionType, key: string, suggestions: string[]) => void;
};

const emptyKv = (): SuggestionsKv => ({
  course_name: {},
  job_role: {},
  project_title: {},
  skill: {},
});

export const useOnboardingSuggestionsStore = create<OnboardingSuggestionsStore>((set, get) => ({
  suggestionsKv: emptyKv(),
  normalizeKey: key => key.toLowerCase().trim(),
  getCached: (type, key) => {
    const normalized = get().normalizeKey(key);
    if (!normalized) return null;
    const bucket = get().suggestionsKv[type]?.[normalized];
    return bucket?.length ? bucket : null;
  },
  setCached: (type, key, suggestions) => {
    const normalized = get().normalizeKey(key);
    if (!normalized || !suggestions.length) return;
    set(state => ({
      suggestionsKv: {
        ...state.suggestionsKv,
        [type]: {
          ...state.suggestionsKv[type],
          [normalized]: suggestions,
        },
      },
    }));
  },
}));
