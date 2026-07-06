"use client";

import { FormattedAgentMessage } from "@/components/chat/FormattedAgentMessage";
import UnibotStrengthsPromptCard, { UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY } from "@/components/chat/UnibotStrengthsPromptCard";
import { strengthsFocusIntroMessage } from "@/features/onboarding/strengths-focus/strengths-focus-copy";
import { useStrengthsFocusStore } from "@/features/onboarding/strengths-focus/useStrengthsFocusStore";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import type { ChatMessage } from "@/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type StrengthsOnboardingFocusViewProps = {
  preferredName?: string | null;
  chatMessages?: ChatMessage[];
  isAgentLoading?: boolean;
  streamingStatusLabel?: string;
};

export default function StrengthsOnboardingFocusView({
  preferredName: preferredNameProp,
  chatMessages = [],
  isAgentLoading = false,
  streamingStatusLabel = "Unibot is thinking…",
}: StrengthsOnboardingFocusViewProps) {
  const router = useRouter();
  const { data: profile } = useProfileData();
  const trigger = useStrengthsFocusStore(s => s.trigger);
  const exit = useStrengthsFocusStore(s => s.exit);
  const preferredName = preferredNameProp ?? profile?.name ?? null;
  const intro = strengthsFocusIntroMessage(trigger, preferredName);

  const handleDone = (replay: boolean) => {
    exit({ replayPending: replay });
    router.refresh();
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(UNIBOT_STRENGTHS_NUDGE_DISMISS_KEY, "1");
    }
    handleDone(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-full px-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p>{intro}</p>
      </div>
      <UnibotStrengthsPromptCard trigger={trigger} onDismiss={handleDismiss} onSaved={() => handleDone(true)} />

      {chatMessages.length > 0 || isAgentLoading ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
          {chatMessages.map(msg =>
            msg.role === "user" && msg.text ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-tr-sm bg-slate-100 px-3 py-2 text-[13px] leading-relaxed text-slate-900 dark:bg-white/5 dark:text-slate-100">
                  {msg.text}
                </div>
              </div>
            ) : msg.role === "model" && msg.text ? (
              <div key={msg.id} className="max-w-full text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                <FormattedAgentMessage content={msg.text} />
              </div>
            ) : null
          )}
          {isAgentLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" />
              <span>{streamingStatusLabel}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
