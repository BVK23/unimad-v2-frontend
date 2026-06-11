"use client";

import LinkedInAnalyzeErrorMessage from "@/components/linkedin/LinkedInAnalyzeErrorMessage";
import type { LinkedInAnalyzerErrorCode } from "@/features/linkedin/types";
import { ChevronDown, Linkedin, RefreshCw } from "lucide-react";

const PREVIEW_SECTIONS = [
  { id: "pic", name: "Profile Picture", score: 78 },
  { id: "cover", name: "Cover Picture", score: 64 },
  { id: "headline", name: "Headline", score: 52 },
  { id: "about", name: "About Section", score: 71 },
  { id: "exp", name: "Experience", score: 83 },
  { id: "skills", name: "Skills", score: 59 },
] as const;

const PREVIEW_OVERALL_SCORE = 68;

interface LinkedInCalculateScorePreviewProps {
  isAnalyzing: boolean;
  error?: string | null;
  errorCode?: LinkedInAnalyzerErrorCode;
  onCalculate: () => void;
}

const LinkedInCalculateScorePreview: React.FC<LinkedInCalculateScorePreviewProps> = ({
  isAnalyzing,
  error,
  errorCode,
  onCalculate,
}) => {
  return (
    <div className="relative flex-1 min-h-full overflow-hidden bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="pointer-events-none select-none blur-[3px] opacity-70" aria-hidden>
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111]">
                <div className="border-b border-slate-100 p-6 dark:border-slate-800">
                  <h3 className="text-xl font-normal text-slate-900 dark:text-white">Profile breakdown</h3>
                  <p className="mt-1 text-sm text-slate-500">Detailed analysis of your profile sections with actionable tips.</p>
                </div>
                <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {PREVIEW_SECTIONS.map(section => (
                    <div key={section.id} className="flex items-start gap-5 p-6">
                      <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100 dark:text-slate-800"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="text-yellow-500"
                            strokeDasharray={`${section.score}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-medium text-slate-700 dark:text-slate-300">{section.score}%</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-base font-medium text-slate-900 dark:text-white">{section.name}</h4>
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#346DE0] dark:bg-blue-950/50 dark:text-blue-300">
                            Improve
                          </span>
                        </div>
                        <p className="mb-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          Personalized feedback for your {section.name.toLowerCase()} will appear here after analysis.
                        </p>
                        <p className="text-xs italic text-slate-400 dark:text-slate-500">Tip: Actionable suggestions show up once your score is ready.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111]">
                <div className="mb-3 h-16 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="relative mb-4">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg dark:border-black dark:bg-slate-700" />
                </div>
                <h2 className="mb-1 font-medium text-slate-900 dark:text-white">Profile Strength</h2>
                <span className="mb-3 text-2xl font-medium text-[#346DE0]">{PREVIEW_OVERALL_SCORE}/100</span>
                <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2.5 rounded-full bg-[#346DE0]" style={{ width: `${PREVIEW_OVERALL_SCORE}%` }} />
                </div>
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white">
                  <ChevronDown size={12} className="rotate-180" aria-hidden />
                  Re-Analyze
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/75 p-6 backdrop-blur-[2px] dark:bg-[#0a0a0a]/80">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-[#111]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
            <Linkedin size={32} className="text-[#346DE0] dark:text-blue-400" aria-hidden />
          </div>
          <h2 className="mb-3 text-2xl font-normal text-slate-900 dark:text-white">Calculate your LinkedIn score</h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            We&apos;ll use the LinkedIn URL you provided during onboarding to fetch your public profile data and score each
            section.
          </p>

          <button
            type="button"
            onClick={onCalculate}
            disabled={isAnalyzing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#346DE0] py-3.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#254DB3] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={20} className="animate-spin" aria-hidden />
                Analyzing profile…
              </>
            ) : (
              "Calculate my score"
            )}
          </button>

          {error ? (
            <LinkedInAnalyzeErrorMessage error={error} code={errorCode} className="mt-4 text-left text-xs text-red-600 dark:text-red-400" />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LinkedInCalculateScorePreview;
