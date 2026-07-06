"use client";

import type { UnibotIncomingRequest } from "@/components/chat/unibot-incoming-request";
import { create } from "zustand";

export type StrengthsFocusTrigger = "linkedin" | "resume" | "application_asset" | "content_gen" | "dev" | "general";

type StrengthsFocusStore = {
  active: boolean;
  trigger: StrengthsFocusTrigger;
  enteredAt: number | null;
  pendingIncomingRequest: UnibotIncomingRequest | null;
  enter: (trigger: StrengthsFocusTrigger, pending?: UnibotIncomingRequest | null) => void;
  exit: (options?: { replayPending?: boolean }) => UnibotIncomingRequest | null;
};

export const STRENGTHS_FOCUS_REPLAY_EVENT = "unibot-strengths-focus-replay";

export function mapStrengthsFocusTrigger(req: UnibotIncomingRequest | null | undefined, devPreview: boolean): StrengthsFocusTrigger {
  if (devPreview) return "dev";
  if (!req) return "general";
  if (req.type === "improve" && req.improveType === "linkedin") return "linkedin";
  if (req.type === "improve" && req.feature === "application_asset") return "application_asset";
  if (req.type === "improve" && req.improveType === "resume") return "resume";
  if (req.type === "content_gen_topic") return "content_gen";
  return "general";
}

export const useStrengthsFocusStore = create<StrengthsFocusStore>((set, get) => ({
  active: false,
  trigger: "general",
  enteredAt: null,
  pendingIncomingRequest: null,
  enter: (trigger, pending = null) => {
    set({ active: true, trigger, enteredAt: Date.now(), pendingIncomingRequest: pending });
  },
  exit: ({ replayPending = false } = {}) => {
    const pending = get().pendingIncomingRequest;
    set({ active: false, trigger: "general", enteredAt: null, pendingIncomingRequest: null });
    if (replayPending && pending && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(STRENGTHS_FOCUS_REPLAY_EVENT, { detail: pending }));
    }
    return pending;
  },
}));
