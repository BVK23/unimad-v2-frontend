"use client";

import type { OnboardingTestAnswers } from "@/components/uniboard-onboarding/testMode";
import { saveOnboardingData, type OnboardingSaveType } from "@/lib/actions/onboardingActions";
import { create } from "zustand";

export type OnboardingAnswers = OnboardingTestAnswers;

export const EMPTY_ONBOARDING_ANSWERS: OnboardingAnswers = {
  name: "",
  phone: "",
  linkedin: "",
  goals: [],
  focus: [],
  stage: [],
  personalize: null,
  resumeUploaded: false,
  strengths: [],
  problems: [],
  praise: [],
};

type FailedSave = { type: OnboardingSaveType; data: Record<string, unknown> };

/**
 * In-flight requests keyed by save type. Kept at module scope because Promises
 * are non-serialisable and don't belong in the reactive store state.
 */
const inflight = new Map<string, Promise<void>>();

/** Signature that ignores volatile fields (e.g. updated_at) so identical payloads dedupe. */
function signatureOf(data: Record<string, unknown>): string {
  return JSON.stringify(data, (key, value) => (key === "updated_at" ? undefined : value));
}

type OnboardingStore = {
  answers: OnboardingAnswers;
  /** Dev/test flag — when true, saves are logged and skipped. */
  skipSave: boolean;
  /** Last successfully-saved signature per type, used to dedupe redundant saves. */
  savedSig: Record<string, string>;
  /** Payloads that failed to save, keyed by type. Retried on next Continue / flush. */
  failed: Record<string, FailedSave>;

  /** Reset the store for a fresh flow (called on mount). */
  initFlow: (init: { answers: OnboardingAnswers; skipSave: boolean }) => void;
  setAnswers: (patch: Partial<OnboardingAnswers>) => void;
  replaceAnswers: (answers: OnboardingAnswers) => void;
  setSkipSave: (skip: boolean) => void;

  /** Optimistic, fire-and-forget save. Dedupes identical payloads; queues failures for retry. */
  save: (type: OnboardingSaveType, data: Record<string, unknown>) => void;
  /** Re-attempt every previously-failed save (call on each Continue). */
  retryFailed: () => void;
  /** Await all in-flight saves + retry failures until nothing is pending (best-effort, bounded). */
  flush: () => Promise<void>;
  hasPendingSaves: () => boolean;
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  answers: EMPTY_ONBOARDING_ANSWERS,
  skipSave: false,
  savedSig: {},
  failed: {},

  initFlow: ({ answers, skipSave }) => {
    inflight.clear();
    set({ answers, skipSave, savedSig: {}, failed: {} });
  },

  setAnswers: patch => set(s => ({ answers: { ...s.answers, ...patch } })),
  replaceAnswers: answers => set({ answers }),
  setSkipSave: skip => set({ skipSave: skip }),

  save: (type, data) => {
    const state = get();
    if (state.skipSave) {
      console.info("[onboarding] skip save", type, data);
      return;
    }

    const sig = signatureOf(data);
    const alreadySaved = state.savedSig[type] === sig;
    const isFailed = Boolean(state.failed[type]);
    // Skip only when this exact payload already saved AND it isn't sitting in the retry queue.
    if (alreadySaved && !isFailed) return;

    const token: { promise?: Promise<void> } = {};
    token.promise = (async () => {
      try {
        await saveOnboardingData(type, data);
        set(s => {
          const failed = { ...s.failed };
          delete failed[type];
          return { failed, savedSig: { ...s.savedSig, [type]: sig } };
        });
      } catch (err) {
        console.warn("[onboarding] save failed — queued for retry", type, err);
        set(s => ({ failed: { ...s.failed, [type]: { type, data } } }));
      } finally {
        if (inflight.get(type) === token.promise) inflight.delete(type);
      }
    })();

    inflight.set(type, token.promise);
  },

  retryFailed: () => {
    const { failed, save } = get();
    Object.values(failed).forEach(({ type, data }) => save(type, data));
  },

  flush: async () => {
    const { retryFailed } = get();
    retryFailed();
    // Drain in-flight requests; retry any fresh failures a bounded number of times.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (inflight.size > 0) {
        await Promise.allSettled([...inflight.values()]);
      }
      if (Object.keys(get().failed).length === 0) break;
      if (attempt < 3) retryFailed();
    }
  },

  hasPendingSaves: () => inflight.size > 0 || Object.keys(get().failed).length > 0,
}));
