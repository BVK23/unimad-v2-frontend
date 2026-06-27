"use client";

import type { UnimadNavigationAction } from "@/src/features/adk-chat/parse-unimad-navigation";

type Props = {
  navigation: UnimadNavigationAction;
  onNavigate: (path: string) => void;
};

export function UnimadNavigationChip({ navigation, onNavigate }: Props) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => onNavigate(navigation.path)}
        className="text-left text-[11px] font-semibold px-3 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors"
      >
        {navigation.label}
      </button>
    </div>
  );
}
