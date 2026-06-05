import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import { create } from "zustand";

type ContentGenStudioState = {
  topic: string;
  funnel: ContentGenFunnel | null;
  assetId: string | null;
  draftPreview: string;
  setTopic: (topic: string) => void;
  setFunnel: (funnel: ContentGenFunnel | null) => void;
  setAssetId: (assetId: string | null) => void;
  setDraftPreview: (draft: string) => void;
  syncFromStudio: (patch: { topic?: string; funnel?: ContentGenFunnel | null; assetId?: string | null; draftPreview?: string }) => void;
};

export const useContentGenStudioStore = create<ContentGenStudioState>((set, get) => ({
  topic: "",
  funnel: null,
  assetId: null,
  draftPreview: "",
  setTopic: topic => set({ topic }),
  setFunnel: funnel => set({ funnel }),
  setAssetId: assetId => set({ assetId }),
  setDraftPreview: draftPreview => set({ draftPreview }),
  syncFromStudio: patch => set({ ...get(), ...patch }),
}));
