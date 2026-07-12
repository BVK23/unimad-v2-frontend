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
  /** Document HTML before this refinement (captured before ADK stream updates draftPreview). */
  baselineDraft: string;
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
  /** Latest editor HTML from Studio — fallback when Zustand preview lags. */
  liveDocumentBody: string;
  /** Stashed before Generate Another clears preview; restored on failure. */
  regenerateBaselineBody: string;
  selectedText: string;
  selectionRect: ApplicationAssetSelectionRect | null;
  /** Plain-text span the user sent to Unibot — briefly highlighted until refinement is handed off to chat. */
  refineAnchorText: string;
  /** True while ChatSidebar is waiting on ADK for a selection quick-action refinement. */
  selectionRefineLoading: boolean;
  /** Stashed context from the last selection action, consumed by offerApplicationAssetDraftReview. */
  pendingRefineContext: PendingRefineContext | null;
  /** Selection tooltip suggestion ids already sent this improve session. */
  consumedSelectionSuggestionIds: string[];
  /** True while Generate Another is in flight — session PATCH sends empty body so agent runs first-draft flow. */
  regenerateAnotherInFlight: boolean;
  syncFromStudio: (
    patch: Partial<
      Omit<
        ApplicationAssetStudioState,
        | "syncFromStudio"
        | "setSelection"
        | "clearSelection"
        | "setRefineAnchor"
        | "clearRefineAnchor"
        | "setSelectionRefineLoading"
        | "setPendingRefineContext"
        | "consumePendingRefineContext"
        | "markSelectionSuggestionUsed"
        | "clearConsumedSelectionSuggestions"
        | "setRegenerateAnotherInFlight"
      >
    >
  ) => void;
  setRegenerateAnotherInFlight: (inFlight: boolean) => void;
  setSelection: (text: string, rect: DOMRect | ApplicationAssetSelectionRect | null) => void;
  clearSelection: () => void;
  setRefineAnchor: (text: string) => void;
  clearRefineAnchor: () => void;
  setSelectionRefineLoading: (loading: boolean) => void;
  setPendingRefineContext: (ctx: PendingRefineContext | null) => void;
  consumePendingRefineContext: () => PendingRefineContext | null;
  markSelectionSuggestionUsed: (suggestionId: string) => void;
  clearConsumedSelectionSuggestions: () => void;
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
  liveDocumentBody: "",
  regenerateBaselineBody: "",
  selectedText: "",
  selectionRect: null as ApplicationAssetSelectionRect | null,
  refineAnchorText: "",
  selectionRefineLoading: false,
  pendingRefineContext: null as PendingRefineContext | null,
  consumedSelectionSuggestionIds: [] as string[],
  regenerateAnotherInFlight: false,
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
  setRefineAnchor: text => set({ refineAnchorText: text.trim() }),
  clearRefineAnchor: () => set({ refineAnchorText: "" }),
  setSelectionRefineLoading: loading =>
    set(state => ({
      selectionRefineLoading: loading,
      refineAnchorText: loading ? "" : state.refineAnchorText,
    })),
  setPendingRefineContext: ctx => set({ pendingRefineContext: ctx }),
  consumePendingRefineContext: () => {
    const ctx = get().pendingRefineContext;
    if (ctx) set({ pendingRefineContext: null });
    return ctx;
  },
  markSelectionSuggestionUsed: suggestionId => {
    const id = suggestionId.trim();
    if (!id) return;
    set(state => ({
      consumedSelectionSuggestionIds: state.consumedSelectionSuggestionIds.includes(id)
        ? state.consumedSelectionSuggestionIds
        : [...state.consumedSelectionSuggestionIds, id],
    }));
  },
  clearConsumedSelectionSuggestions: () => set({ consumedSelectionSuggestionIds: [] }),
  setRegenerateAnotherInFlight: inFlight => set({ regenerateAnotherInFlight: inFlight }),
  reset: () => set(initialState),
}));
