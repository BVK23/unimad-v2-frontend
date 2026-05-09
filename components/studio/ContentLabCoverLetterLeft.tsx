"use client";

import { useEffect, useRef, useState } from "react";
import { useCoverLetterHistory } from "@/features/cover-letter/hooks/useCoverLetterHistory";
import { useGenerateCoverLetter } from "@/features/cover-letter/hooks/useGenerateCoverLetter";
import type { GenerateCoverLetterResult } from "@/features/cover-letter/hooks/useGenerateCoverLetter";
import { fetchCoverLetterById } from "@/features/cover-letter/server-actions/cover-letter-actions";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { History, Wand2 } from "lucide-react";
import AllCoverLettersModal from "./AllCoverLettersModal";

interface ContentLabCoverLetterLeftProps {
  onDraftChange: (draft: CoverLetterAsset | null) => void;
  activeDraft?: CoverLetterAsset | null;
  isEditorActive?: boolean;
  onGeneratingChange?: (isGenerating: boolean) => void;
  initialDraftId?: string | null;
}

export default function ContentLabCoverLetterLeft({
  onDraftChange,
  activeDraft,
  isEditorActive,
  onGeneratingChange,
  initialDraftId,
}: ContentLabCoverLetterLeftProps) {
  const [role, setRole] = useState(activeDraft?.role ?? "");
  const [company, setCompany] = useState(activeDraft?.company ?? "");
  const [jobDescription, setJobDescription] = useState(activeDraft?.job_description ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: { role: string; company: string; job_description: string };
  } | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const hydratedIdRef = useRef<string | null>(null);

  const { data: historyList = [], isLoading: historyLoading } = useCoverLetterHistory();
  const generateMutation = useGenerateCoverLetter({
    onSuccess: (result: GenerateCoverLetterResult) => {
      if ("success" in result && result.success) {
        const draft: CoverLetterAsset = {
          id: result.id,
          role: result.role,
          company: result.company,
          job_description: result.job_description,
          content: result.content,
        };
        hydrateFormFromDraft(draft);
        onDraftChange(draft);
      }
      if ("subscriptionRequired" in result && result.subscriptionRequired) {
        setSubscriptionModal(true);
      }
    },
    onError: (msg: string) => setFormError(msg),
  });

  const hydrateFormFromDraft = (draft: CoverLetterAsset) => {
    setRole(draft.role ?? "");
    setCompany(draft.company ?? "");
    setJobDescription(draft.job_description ?? "");
  };

  const handleGenerate = () => {
    setFormError(null);
    const trimmedRole = role.trim();
    const trimmedCompany = company.trim();
    const trimmedJd = jobDescription.trim();
    if (!trimmedRole || !trimmedCompany || !trimmedJd) {
      setFormError("Please fill Role, Company and Job Description.");
      return;
    }
    onGeneratingChange?.(true);
    generateMutation.mutate(
      {
        role: trimmedRole,
        company: trimmedCompany,
        job_description: trimmedJd,
      },
      {
        onSuccess: (result: GenerateCoverLetterResult) => {
          if ("duplicate" in result && result.duplicate && "existing_asset_id" in result) {
            setDuplicateModal({
              existingAssetId: result.existing_asset_id,
              params: {
                role: trimmedRole,
                company: trimmedCompany,
                job_description: trimmedJd,
              },
            });
          }
        },
        onSettled: () => {
          onGeneratingChange?.(false);
        },
      }
    );
  };

  const handleUseExisting = async () => {
    if (!duplicateModal) return;
    const full = await fetchCoverLetterById(duplicateModal.existingAssetId);
    if (full) {
      hydrateFormFromDraft(full);
      onDraftChange(full);
    }
    setDuplicateModal(null);
  };

  const handleCreateNewAnyway = async () => {
    if (!duplicateModal) return;
    const result = await generateMutation.replaceExistingAndGenerate(duplicateModal.existingAssetId, duplicateModal.params);
    setDuplicateModal(null);
    if ("success" in result && result.success) {
      const draft: CoverLetterAsset = {
        id: result.id,
        role: result.role,
        company: result.company,
        job_description: result.job_description,
        content: result.content,
      };
      hydrateFormFromDraft(draft);
      onDraftChange(draft);
    }
  };

  const historyCount = historyList.length;

  const hasDraft = !!activeDraft;
  const isEnhanceState = hasDraft && !!isEditorActive;
  const primaryLabel = generateMutation.isPending ? "Crafting..." : isEnhanceState ? "Enhance Draft" : "Generate Draft";
  const isPrimaryDisabled = generateMutation.isPending || isEnhanceState;

  useEffect(() => {
    if (!initialDraftId) {
      hydratedIdRef.current = null;
      return;
    }
    if (hydratedIdRef.current === initialDraftId || String(activeDraft?.id ?? "") === initialDraftId) {
      return;
    }
    hydratedIdRef.current = initialDraftId;
    const hydrate = async () => {
      const full = await fetchCoverLetterById(initialDraftId);
      if (!full) return;
      hydrateFormFromDraft(full);
      onDraftChange(full);
    };
    hydrate();
  }, [activeDraft?.id, initialDraftId, onDraftChange]);

  return (
    <>
      <div className="space-y-5">
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setShowAllModal(true);
            }}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center gap-2 hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-sm transition-all group"
          >
            <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
              <History size={14} />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">History</span>
            </div>
            <span className="ml-auto text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
              {historyCount}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cover-letter-role" className="block text-xs font-medium text-slate-500 uppercase mb-2">
              Role
            </label>
            <input
              id="cover-letter-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Product Designer"
            />
          </div>
          <div>
            <label htmlFor="cover-letter-company" className="block text-xs font-medium text-slate-500 uppercase mb-2">
              Company
            </label>
            <input
              id="cover-letter-company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Spotify"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cover-letter-jd" className="block text-xs font-medium text-slate-500 uppercase mb-2">
            Job Description
          </label>
          <textarea
            id="cover-letter-jd"
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Paste the JD here..."
          />
        </div>

        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {formError}
          </p>
        )}

        <button
          type="button"
          onClick={!isEnhanceState ? handleGenerate : undefined}
          disabled={isPrimaryDisabled}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {generateMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={18} />
          )}
          {primaryLabel}
        </button>
      </div>

      {duplicateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="duplicate-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="duplicate-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Cover Letter Already Exists
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              A cover letter for this role and company already exists. You can use it or create a new one to replace it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleUseExisting}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Use existing
              </button>
              <button
                type="button"
                onClick={handleCreateNewAnyway}
                disabled={generateMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Create new anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptionModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="subscription-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="subscription-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Subscription required
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Cover letter generation is available for subscribers. Upgrade to continue.
            </p>
            <button
              type="button"
              onClick={() => setSubscriptionModal(false)}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAllModal && (
        <AllCoverLettersModal
          onClose={() => setShowAllModal(false)}
          historyItems={historyList}
          onItemClick={item => {
            hydrateFormFromDraft(item);
            onDraftChange(item);
            setShowAllModal(false);
          }}
        />
      )}
    </>
  );
}
