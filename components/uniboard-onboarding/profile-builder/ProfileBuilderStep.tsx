"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import type { PersonalizationProfile } from "@/features/onboarding/types";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import { ArrowLeft, Loader2 } from "lucide-react";
import ProfileBuilderChatPanel from "./ProfileBuilderChatPanel";
import ProfileBuilderSectionsPanel from "./ProfileBuilderSectionsPanel";
import { isProfileBuilderComplete, profileBuilderValidationError } from "./profileBuilderEngine";
import { useProfileBuilderStore } from "./useProfileBuilderStore";

type ProfileBuilderStepProps = {
  preferredName: string;
  personalization?: PersonalizationProfile | null;
  onBack: () => void;
  onComplete: () => void;
  skipSave?: boolean;
};

export default function ProfileBuilderStep({
  preferredName,
  personalization,
  onBack,
  onComplete,
  skipSave = false,
}: ProfileBuilderStepProps) {
  const data = useProfileBuilderStore(s => s.data);
  const reset = useProfileBuilderStore(s => s.reset);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  const handleContinue = async () => {
    const validationError = profileBuilderValidationError(data);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!isProfileBuilderComplete(data)) {
      setError("Please complete all required sections.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (!skipSave) {
        await saveOnboardingData("educations", { educations: data.educations });
        await saveOnboardingData("experiences", { experiences: data.experiences });
        await saveOnboardingData("projects", { projects: data.projects });
        await saveOnboardingData("skills", { skills: data.skills });
      } else {
        console.info("[onboarding test] skip profile builder save", data);
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FB]" style={{ fontFamily: "'Onest', system-ui, sans-serif" }}>
      <header className="flex shrink-0 items-center justify-between border-b border-[rgba(12,15,26,0.06)] bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-lg p-2 text-[#4A5568] hover:bg-[#F8F9FB]" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <Logo className="h-6" />
        </div>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={busy}
          className="rounded-[12px] bg-[#346DE0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : "Continue"}
        </button>
      </header>

      {error ? (
        <p className="shrink-0 bg-red-50 px-4 py-2 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ProfileBuilderChatPanel preferredName={preferredName} personalization={personalization} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-[rgba(12,15,26,0.08)]">
          <ProfileBuilderSectionsPanel />
        </div>
      </div>
    </div>
  );
}
