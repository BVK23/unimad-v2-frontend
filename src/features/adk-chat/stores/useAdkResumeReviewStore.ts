import type { ResumeData } from "@/types";
import { create } from "zustand";
import type { PdfHighlightMap } from "../adkResumeHighlightDiff";

export type AdkResumeReviewState = {
  resumeId: string | null;
  /** Serialized baseline for discard + ack sync */
  baselineResumeJson: string | null;
  highlights: PdfHighlightMap;
  bannerTitle: string;
  showReviewActions: boolean;
  saveHandlers: Record<string, () => Promise<void>>;

  beginReview: (input: {
    resumeId: string;
    baselineResume: ResumeData;
    highlights: PdfHighlightMap;
    bannerTitle: string;
  }) => void;
  /** After successful save — clears stripes and action buttons; banner can stay */
  markReviewAccepted: () => void;
  /** Restore baseline into store (caller must also PATCH ADK session + query cache + editor ack) */
  getBaselineResume: () => ResumeData | null;
  clearReview: () => void;

  registerSaveHandler: (resumeId: string, fn: () => Promise<void>) => void;
  unregisterSaveHandler: (resumeId: string) => void;
  acceptAndSave: () => Promise<void>;
};

export const useAdkResumeReviewStore = create<AdkResumeReviewState>((set, get) => ({
  resumeId: null,
  baselineResumeJson: null,
  highlights: {},
  bannerTitle: "",
  showReviewActions: false,
  saveHandlers: {},

  beginReview: ({ resumeId, baselineResume, highlights, bannerTitle }) => {
    if (Object.keys(highlights).length === 0) return;
    set({
      resumeId,
      baselineResumeJson: JSON.stringify(baselineResume),
      highlights,
      bannerTitle,
      showReviewActions: true,
    });
  },

  markReviewAccepted: () => {
    set({
      highlights: {},
      showReviewActions: false,
      baselineResumeJson: null,
      resumeId: null,
    });
  },

  getBaselineResume: () => {
    const raw = get().baselineResumeJson;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ResumeData;
    } catch {
      return null;
    }
  },

  clearReview: () => {
    set({
      resumeId: null,
      baselineResumeJson: null,
      highlights: {},
      bannerTitle: "",
      showReviewActions: false,
    });
  },

  registerSaveHandler: (resumeId, fn) => {
    set(state => ({
      saveHandlers: { ...state.saveHandlers, [resumeId]: fn },
    }));
  },

  unregisterSaveHandler: resumeId => {
    set(state => {
      const next = { ...state.saveHandlers };
      delete next[resumeId];
      return { saveHandlers: next };
    });
  },

  acceptAndSave: async () => {
    const { resumeId, showReviewActions, saveHandlers } = get();
    if (!resumeId || !showReviewActions) return;
    const fn = saveHandlers[resumeId];
    if (fn) {
      await fn();
    }
    get().markReviewAccepted();
  },
}));
