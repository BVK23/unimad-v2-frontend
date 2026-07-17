"use client";

import { useState } from "react";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { usePortfolioGenerationStore } from "@/features/portfolio/store/usePortfolioGenerationStore";
import type { UnimadNavigationAction } from "@/src/features/adk-chat/parse-unimad-navigation";
import { generateVpd } from "@/src/features/vpd/server-actions/vpd-actions";
import { isGenerateVpdDuplicate } from "@/src/features/vpd/types";
import { AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";

type Props = {
  navigation: UnimadNavigationAction;
  onNavigate: (path: string) => void;
};

const DEFAULT_REGENERATE_MESSAGE =
  "This will replace your current portfolio with a newly generated draft. You can revert once afterward from the portfolio help menu if you change your mind.";

const DEFAULT_VPD_GENERATE_MESSAGE = "This will create a new Value Proposition Document from the job description discussed in chat.";

/** Text CTA for Unibot navigation suggestions (resume deep-links, feature Go-to, etc.). */
export function UnimadNavigationChip({ navigation, onNavigate }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsConfirm = navigation.confirm === true || navigation.action === "portfolio_regenerate" || navigation.action === "vpd_generate";

  const handleClick = () => {
    if (needsConfirm) {
      setError(null);
      setConfirmOpen(true);
      return;
    }
    onNavigate(navigation.path);
  };

  const handleConfirm = async () => {
    if (navigation.action === "portfolio_regenerate") {
      usePortfolioGenerationStore.getState().setPendingAction("replace");
      setConfirmOpen(false);
      onNavigate(navigation.path);
      return;
    }

    if (navigation.action === "vpd_generate") {
      setGenerating(true);
      setError(null);
      try {
        const result = await generateVpd({
          schemaVersion: 2,
          ...(navigation.application_id
            ? { application_id: navigation.application_id }
            : {
                role: navigation.role,
                company: navigation.company,
                jobDescription: navigation.job_description,
              }),
        });

        if (isGenerateVpdDuplicate(result)) {
          const existingId = result.existing_vpd_id;
          setConfirmOpen(false);
          onNavigate(existingId ? `/uniboard/studio?type=vpd&id=${encodeURIComponent(existingId)}` : "/uniboard/studio?type=vpd");
          return;
        }

        const newId = String(result.id || "").trim();
        setConfirmOpen(false);
        onNavigate(newId ? `/uniboard/studio?type=vpd&id=${encodeURIComponent(newId)}` : "/uniboard/studio?type=vpd");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate VPD");
      } finally {
        setGenerating(false);
      }
      return;
    }

    setConfirmOpen(false);
    onNavigate(navigation.path);
  };

  const isVpd = navigation.action === "vpd_generate";
  const title = isVpd ? "Create VPD from this JD?" : "Regenerate full portfolio?";
  const body = navigation.confirm_message || (isVpd ? DEFAULT_VPD_GENERATE_MESSAGE : DEFAULT_REGENERATE_MESSAGE);
  const confirmLabel = isVpd ? (generating ? "Creating…" : "Create VPD") : "Regenerate portfolio";

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
            if (!generating) setConfirmOpen(false);
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
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{body}</p>
                {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 bg-slate-50 p-4 dark:bg-slate-900/50">
              <button
                type="button"
                disabled={generating}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleConfirm()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {generating ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                {confirmLabel}
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      ) : null}
    </div>
  );
}
