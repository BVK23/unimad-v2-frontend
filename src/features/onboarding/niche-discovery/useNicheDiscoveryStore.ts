"use client";

import { create } from "zustand";

type NicheDiscoveryStore = {
  active: boolean;
  enteredAt: number | null;
  enter: () => void;
  exit: () => void;
};

export const useNicheDiscoveryStore = create<NicheDiscoveryStore>(set => ({
  active: false,
  enteredAt: null,
  enter: () => set({ active: true, enteredAt: Date.now() }),
  exit: () => set({ active: false, enteredAt: null }),
}));
