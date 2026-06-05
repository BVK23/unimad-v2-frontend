import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { create } from "zustand";

export type ApplicationAssetSelectionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PendingRefineContext = {
  assetType: ApplicationAssetApiType;
  selectedText: string;
  presetLabel?: string;
  kind: "preset" | "freeform";
};

type ApplicationAssetStudioState = {
  assetType: ApplicationAssetApiType | null;
  assetId: string | null;
  applicationId: string | null;
  role: string;
  company: string;
  jobDescription: string;
  contactName: string;
  draftPreview: string;
  acceptedContent: string;
  selectedText: string;
  selectionRect: ApplicationAssetSelectionRect | null;
  /** True while ChatSidebar is waiting on ADK for a selection quick-action refinement. */
  selectionRefineLoading: boolean;
  /** Stashed context from the last selection action, consumed by offerApplicationAssetDraftReview. */
  pendingRefineContext: PendingRefineContext | null;
  syncFromStudio: (
    patch: Partial<
      Omit<
        ApplicationAssetStudioState,
        | "syncFromStudio"
        | "setSelection"
        | "clearSelection"
        | "setSelectionRefineLoading"
        | "setPendingRefineContext"
        | "consumePendingRefineContext"
      >
    >
  ) => void;
  setSelection: (text: string, rect: DOMRect | ApplicationAssetSelectionRect | null) => void;
  clearSelection: () => void;
  setSelectionRefineLoading: (loading: boolean) => void;
  setPendingRefineContext: (ctx: PendingRefineContext | null) => void;
  consumePendingRefineContext: () => PendingRefineContext | null;
  reset: () => void;
};

const rectFromInput = (rect: DOMRect | ApplicationAssetSelectionRect | null): ApplicationAssetSelectionRect | null => {
  if (!rect) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

const initialState = {
  assetType: null as ApplicationAssetApiType | null,
  assetId: null as string | null,
  applicationId: null as string | null,
  role: "",
  company: "",
  jobDescription: "",
  contactName: "",
  draftPreview: "",
  acceptedContent: "",
  selectedText: "",
  selectionRect: null as ApplicationAssetSelectionRect | null,
  selectionRefineLoading: false,
  pendingRefineContext: null as PendingRefineContext | null,
};

export const useApplicationAssetStudioStore = create<ApplicationAssetStudioState>((set, get) => ({
  ...initialState,
  syncFromStudio: patch => set({ ...get(), ...patch }),
  setSelection: (text, rect) =>
    set({
      selectedText: text,
      selectionRect: rectFromInput(rect),
    }),
  clearSelection: () => set({ selectedText: "", selectionRect: null }),
  setSelectionRefineLoading: loading => set({ selectionRefineLoading: loading }),
  setPendingRefineContext: ctx => set({ pendingRefineContext: ctx }),
  consumePendingRefineContext: () => {
    const ctx = get().pendingRefineContext;
    if (ctx) set({ pendingRefineContext: null });
    return ctx;
  },
  reset: () => set(initialState),
}));
