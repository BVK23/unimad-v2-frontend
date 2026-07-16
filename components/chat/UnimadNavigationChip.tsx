"use client";

import { useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { usePortfolioGenerationStore } from "@/features/portfolio/store/usePortfolioGenerationStore";
import type { UnimadNavigationAction } from "@/src/features/adk-chat/parse-unimad-navigation";
import { AlertCircle, ArrowUpRight } from "lucide-react";

type Props = {
  navigation: UnimadNavigationAction;
  onNavigate: (path: string) => void;
};

const DEFAULT_REGENERATE_MESSAGE =
  "This will replace your current portfolio with a newly generated draft. You can revert once afterward from the portfolio help menu if you change your mind.";

/** Text CTA for Unibot navigation suggestions (resume deep-links, feature Go-to, etc.). */
export function UnimadNavigationChip({ navigation, onNavigate }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const needsConfirm = navigation.confirm === true || navigation.action === "portfolio_regenerate";

  const handleClick = () => {
    if (needsConfirm) {
      setConfirmOpen(true);
      return;
    }
    onNavigate(navigation.path);
  };

  const handleConfirm = () => {
    if (navigation.action !== "portfolio_regenerate") {
      setConfirmOpen(false);
      onNavigate(navigation.path);
      return;
    }

    usePortfolioGenerationStore.getState().setPendingAction("replace");
    setConfirmOpen(false);
    onNavigate(navigation.path);
  };

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex max-w-full items-center gap-0.5 text-left text-[13px] font-normal leading-snug text-slate-600 transition-colors hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
      >
        <span className="min-w-0 truncate">{navigation.label}</span>
        <ArrowUpRight size={12} aria-hidden className="shrink-0 opacity-60" />
      </button>

      {confirmOpen ? (
        <ModalPortalOverlay
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={e => {
            e.stopPropagation();
            setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-slate-100 p-6 dark:border-white/10">
              <div className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Regenerate full portfolio?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {navigation.confirm_message || DEFAULT_REGENERATE_MESSAGE}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 bg-slate-50 p-4 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
              >
                Regenerate portfolio
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      ) : null}
    </div>
  );
}
