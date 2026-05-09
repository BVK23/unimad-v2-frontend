"use client";

import { useEffect, useRef, useState } from "react";
import { useColdEmailHistory, useGenerateColdEmail } from "@/features/cold-email/hooks";
import type { GenerateColdEmailResult } from "@/features/cold-email/hooks/useGenerateColdEmail";
import { fetchColdEmailById } from "@/features/cold-email/server-actions/cold-email-actions";
import type { ColdEmailAsset } from "@/features/cold-email/types";
import { History, Wand2 } from "lucide-react";
import ColdEmailHistoryModal from "./ColdEmailHistoryModal";

interface ContentLabColdEmailLeftProps {
  onDraftChange: (draft: ColdEmailAsset | null) => void;
  activeDraft?: ColdEmailAsset | null;
  isEditorActive?: boolean;
  onGeneratingChange?: (isGenerating: boolean) => void;
  initialDraftId?: string | null;
}

export default function ContentLabColdEmailLeft({
  onDraftChange,
  activeDraft,
  isEditorActive,
  onGeneratingChange,
  initialDraftId,
}: ContentLabColdEmailLeftProps) {
  const [role, setRole] = useState(activeDraft?.role ?? "");
  const [company, setCompany] = useState(activeDraft?.company ?? "");
  const [jobDescription, setJobDescription] = useState(activeDraft?.job_description ?? "");
  const [managerName, setManagerName] = useState(activeDraft?.hirname ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: {
      role: string;
      company: string;
      job_description: string;
      hirname: string;
    };
  } | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const hydratedIdRef = useRef<string | null>(null);

  const { data: historyList = [], isLoading: historyLoading } = useColdEmailHistory();
  const generateMutation = useGenerateColdEmail({
    onSuccess: (result: GenerateColdEmailResult) => {
      if ("success" in result && result.success) {
        const draft: ColdEmailAsset = {
          id: result.id,
          role: result.role,
          company: result.company,
          job_description: result.job_description,
          hirname: result.hirname,
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

  const hydrateFormFromDraft = (draft: ColdEmailAsset) => {
    setRole(draft.role ?? "");
    setCompany(draft.company ?? "");
    setJobDescription(draft.job_description ?? "");
    setManagerName(draft.hirname ?? "");
  };

  const handleGenerate = () => {
    setFormError(null);
    const trimmedRole = role.trim();
    const trimmedCompany = company.trim();
    const trimmedJd = jobDescription.trim();
    const trimmedHirname = managerName.trim();
    if (!trimmedRole || !trimmedCompany || !trimmedJd || !trimmedHirname) {
      setFormError("Please fill Role, Company, Job Description and Hiring Manager Name.");
      return;
    }
    onGeneratingChange?.(true);
    generateMutation.mutate(
      {
        role: trimmedRole,
        company: trimmedCompany,
        job_description: trimmedJd,
        hirname: trimmedHirname,
      },
      {
        onSuccess: (result: GenerateColdEmailResult) => {
          if ("duplicate" in result && result.duplicate && "existing_asset_id" in result) {
            setDuplicateModal({
              existingAssetId: result.existing_asset_id,
              params: {
                role: trimmedRole,
                company: trimmedCompany,
                job_description: trimmedJd,
                hirname: trimmedHirname,
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
    const full = await fetchColdEmailById(duplicateModal.existingAssetId);
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
      const draft: ColdEmailAsset = {
        id: result.id,
        role: result.role,
        company: result.company,
        job_description: result.job_description,
        hirname: result.hirname,
        content: result.content,
      };
      hydrateFormFromDraft(draft);
      onDraftChange(draft);
    }
  };

  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
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
      const full = await fetchColdEmailById(initialDraftId);
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
            onClick={handleOpenHistoryModal}
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
            <label htmlFor="cold-email-role" className="block text-xs font-medium text-slate-500 uppercase mb-2">
              Role
            </label>
            <input
              id="cold-email-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Product Designer"
            />
          </div>
          <div>
            <label htmlFor="cold-email-company" className="block text-xs font-medium text-slate-500 uppercase mb-2">
              Company
            </label>
            <input
              id="cold-email-company"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Spotify"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cold-email-manager" className="block text-xs font-medium text-slate-500 uppercase mb-2">
            Hiring Manager Name
          </label>
          <input
            id="cold-email-manager"
            value={managerName}
            onChange={e => setManagerName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label htmlFor="cold-email-jd" className="block text-xs font-medium text-slate-500 uppercase mb-2">
            Job Description
          </label>
          <textarea
            id="cold-email-jd"
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
          aria-labelledby="cold-email-duplicate-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="cold-email-duplicate-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Cold Email Already Exists
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              A cold email for this role and company already exists. You can use it or create a new one to replace it.
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
          aria-labelledby="cold-email-subscription-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="cold-email-subscription-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Subscription required
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Cold email generation is available for subscribers. Upgrade to continue.
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

      {showHistoryModal && (
        <ColdEmailHistoryModal
          onClose={() => setShowHistoryModal(false)}
          historyList={historyList}
          onSelect={asset => {
            hydrateFormFromDraft(asset);
            onDraftChange(asset);
            setShowHistoryModal(false);
          }}
        />
      )}
    </>
  );
}
