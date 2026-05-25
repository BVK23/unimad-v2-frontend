import React, { useCallback, useState } from "react";
import LinkedInScheduledPostsModal from "@/components/LinkedInScheduledPostsModal";
import type { UnibotIncomingRequest } from "@/components/chat/unibot-incoming-request";
import type { LinkedInListItem } from "@/components/studio/LinkedInPostListCard";
import StudioSectionDot from "@/components/studio/StudioSectionDot";
import { deleteContentGenAsset } from "@/features/content-lab/server-actions/content-lab-actions";
import { useAnalyzeLinkedInProfile, useLinkedInAnalysis } from "@/features/linkedin/hooks/useLinkedInAnalysis";
import { generateLinkedInConnectionRequest } from "@/features/linkedin/server-actions/linkedin-connection-actions";
import type { LinkedInAnalyzeResult } from "@/features/linkedin/types";
import { LINKEDIN_ADK_PROFILE_KEY, LINKEDIN_COMMENT_EXTENSION_URL } from "@/src/features/linkedin/constants";
import { linkedinScheduledPostsQueryKey, useLinkedInScheduledPosts } from "@/src/features/linkedin/hooks/useLinkedInScheduledPosts";
import { buildLinkedInImproveMessage, linkedInSectionIdToAdkSection } from "@/src/features/linkedin/improve-prompts";
import type { GeneratorContext } from "@/types/jobs";
import { useQueryClient } from "@tanstack/react-query";
import { Linkedin, Download, RefreshCw, ChevronDown, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LinkedInDashboardProps {
  onImprove: (detail: Extract<UnibotIncomingRequest, { type: "improve" }>) => void;
  onNavigateToStudio?: (context: GeneratorContext) => void;
}

/** Matches Jobs “Apply Now” — dark navy Re-Analyze (nextjs branch). */
const PRIMARY_CTA_CLASS =
  "w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800";

const BLUE_PRIMARY_CTA_CLASS =
  "w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#346DE0] hover:bg-[#254DB3] text-white rounded-xl text-xs font-medium transition-all active:scale-95 shadow-md shadow-blue-500/20 disabled:pointer-events-none disabled:opacity-40";

const TEXT_LINK_CTA_CLASS =
  "text-xs font-medium text-[#346DE0] underline underline-offset-2 transition-colors hover:text-[#254DB3] dark:text-blue-400 dark:hover:text-blue-300";

const TEXT_LINK_PLAIN_CLASS =
  "text-xs font-medium text-[#346DE0] transition-colors hover:text-[#254DB3] dark:text-blue-400 dark:hover:text-blue-300";

const formatLastAnalyzedOn = (iso: string): string | null => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Last analyzed on ${d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
};

const LinkedInDashboard: React.FC<LinkedInDashboardProps> = ({ onImprove, onNavigateToStudio }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useLinkedInAnalysis();
  const analyzeMutation = useAnalyzeLinkedInProfile();
  const { data: scheduledPosts = [] } = useLinkedInScheduledPosts(Boolean(data?.result));

  const [profileBreakdownOpen, setProfileBreakdownOpen] = useState(true);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [connectionRecipientName, setConnectionRecipientName] = useState("");
  const [connectionRecipientDesignation, setConnectionRecipientDesignation] = useState("");
  const [generatedConnectionRequest, setGeneratedConnectionRequest] = useState("");
  const [isGeneratingConnection, setIsGeneratingConnection] = useState(false);
  const [connectionGenerateError, setConnectionGenerateError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const analysis: LinkedInAnalyzeResult | null = data?.result ?? null;
  const lastAnalyzedLabel = data?.analyzedAt ? formatLastAnalyzedOn(data.analyzedAt) : null;
  const profileSections = analysis?.sections ?? [];
  const score = analysis?.overallScore ?? 0;
  const hasScheduledPosts = scheduledPosts.length > 0;

  const mutationErrorMessage =
    analyzeMutation.error instanceof Error ? analyzeMutation.error.message : analyzeMutation.error ? String(analyzeMutation.error) : "";

  const queryErrorMessage = error instanceof Error ? error.message : error ? String(error) : "Could not load your LinkedIn analysis.";

  const handleConnectAndAnalyze = () => {
    analyzeMutation.reset();
    analyzeMutation.mutate();
  };

  const handleReanalyze = () => {
    analyzeMutation.reset();
    analyzeMutation.mutate();
  };

  const generateConnectionRequest = async () => {
    const name = connectionRecipientName.trim();
    const designation = connectionRecipientDesignation.trim();
    if (!name || !designation) return;

    setIsGeneratingConnection(true);
    setConnectionGenerateError(null);
    try {
      const { message } = await generateLinkedInConnectionRequest({
        name,
        designation,
        regenerate: Boolean(generatedConnectionRequest.trim()),
      });
      setGeneratedConnectionRequest(message);
    } catch (err) {
      setConnectionGenerateError(err instanceof Error ? err.message : "Failed to generate connection request");
    } finally {
      setIsGeneratingConnection(false);
    }
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback("Copied to clipboard");
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback("Could not copy");
      window.setTimeout(() => setCopyFeedback(null), 2500);
    }
  }, []);

  const openConnectionGenerateMore = () => {
    if (!generatedConnectionRequest.trim()) return;
    onImprove({
      type: "improve",
      improveType: "linkedin",
      feature: "linkedin",
      featureId: LINKEDIN_ADK_PROFILE_KEY,
      section: "connection",
      topicTitle: "LinkedIn · Connection request",
      requestKey: Date.now(),
      text: buildLinkedInImproveMessage("connection"),
    });
  };

  const goToStudio = () => {
    if (onNavigateToStudio) {
      onNavigateToStudio({ type: "linkedin-post" });
    } else {
      router.push("/uniboard/studio?type=linkedin-post");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0a0a] min-h-full">
        <RefreshCw size={32} className="animate-spin text-[#346DE0] dark:text-blue-400 mb-4" aria-hidden />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading your LinkedIn analysis…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0a0a] min-h-full">
        <div className="max-w-md w-full bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{queryErrorMessage}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="w-full py-3 bg-[#346DE0] hover:bg-[#254DB3] text-white font-medium rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0a0a0a] min-h-full">
        <div className="max-w-md w-full bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Linkedin size={32} className="text-[#346DE0] dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-normal text-slate-900 dark:text-white mb-3">Connect your LinkedIn</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
            Unimad needs access to your LinkedIn profile to analyze it, suggest improvements, and help you network faster.
          </p>

          <button
            type="button"
            onClick={handleConnectAndAnalyze}
            disabled={analyzeMutation.isPending}
            className="w-full py-3.5 bg-[#346DE0] hover:bg-[#254DB3] text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:pointer-events-none"
          >
            {analyzeMutation.isPending ? (
              <>
                <RefreshCw size={20} className="animate-spin" aria-hidden /> Analyzing Profile...
              </>
            ) : (
              "Connect & Analyze"
            )}
          </button>
          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-medium">Secure connection via OAuth 2.0</p>
          {mutationErrorMessage ? <p className="text-xs text-red-500 mt-3">{mutationErrorMessage}</p> : null}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto relative">
      {copyFeedback ? (
        <div
          className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900/95 px-4 py-2 text-xs font-medium text-white shadow-lg dark:bg-white/95 dark:text-slate-900"
          role="status"
        >
          {copyFeedback}
        </div>
      ) : null}

      <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <Download size={16} className="text-blue-400" />
          </div>
          <span className="text-sm font-medium" style={{ fontFamily: "Onest, sans-serif" }}>
            Get the{" "}
            <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 animate-gradient-x">
              Unimad LinkedIn Optimiser
            </span>{" "}
            for Chrome/Brave
          </span>
        </div>
        <a
          href={LINKEDIN_COMMENT_EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          Add to Chrome
        </a>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: Profile breakdown + Unicoach CTA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111]">
              <div className="border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  aria-expanded={profileBreakdownOpen}
                  onClick={() => setProfileBreakdownOpen(o => !o)}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <h3 className="text-xl font-normal text-slate-900 dark:text-white">Profile breakdown</h3>
                    <p className="mt-1 text-sm text-slate-500">Detailed analysis of your profile sections with actionable tips.</p>
                  </div>
                  <ChevronDown
                    size={22}
                    className={`mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${profileBreakdownOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {profileBreakdownOpen ? (
                  <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                    {profileSections.map(section => (
                      <div
                        key={section.id}
                        className="flex items-start gap-5 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
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
                              className={`${section.score > 80 ? "text-green-500" : section.score > 50 ? "text-yellow-500" : "text-red-500"} transition-all duration-1000 ease-out`}
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
                            <button
                              type="button"
                              onClick={() => {
                                const adkSection = linkedInSectionIdToAdkSection(section.id);
                                if (!adkSection) return;
                                onImprove({
                                  type: "improve",
                                  improveType: "linkedin",
                                  feature: "linkedin",
                                  featureId: LINKEDIN_ADK_PROFILE_KEY,
                                  section: adkSection,
                                  text: buildLinkedInImproveMessage(adkSection),
                                  topicTitle: `LinkedIn · ${section.name}`,
                                  requestKey: Date.now(),
                                });
                              }}
                              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#346DE0] transition-colors hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/40"
                            >
                              Improve
                            </button>
                          </div>
                          <p className="mb-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{section.feedback}</p>
                          <p className="text-xs italic text-slate-400 dark:text-slate-500">Tip: {section.tip}</p>
                        </div>
                      </div>
                    ))}
                    {!profileSections.length ? (
                      <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No section analysis found for this profile yet.</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="border-t border-slate-100 p-6 dark:border-slate-800">
                <Link
                  href="/uniboard/unicoach"
                  className="relative block w-full overflow-hidden rounded-xl border border-[#0a66c2]/25 bg-[#0a66c2] transition-opacity hover:opacity-95"
                >
                  <span className="linkedin-unicoach-cta-shimmer pointer-events-none absolute inset-0" aria-hidden />
                  <span className="relative z-10 flex w-full items-center justify-center px-4 py-2.5 text-xs font-medium text-white">
                    Get expert advice with Unicoach
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Profile strength, Content Lab, Connection request */}
          <div className="space-y-6">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111]">
              {analysis.coverPictureUrl ? (
                <div className="mb-3 h-16 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={analysis.coverPictureUrl} alt="LinkedIn cover" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ) : null}
              <div className="relative mb-4">
                <div className="relative z-10 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-black">
                  {analysis.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={analysis.profilePictureUrl} alt="LinkedIn profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <span className="text-2xl font-medium text-slate-400">
                        {(analysis.displayName || "me").slice(0, 2).toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 -z-0 scale-110 rounded-full border border-slate-200 dark:border-slate-800" />
              </div>

              <h2 className="mb-1 font-medium text-slate-900 dark:text-white">Profile Strength</h2>
              <span className="mb-3 text-2xl font-medium text-[#346DE0]">{score}/100</span>
              {lastAnalyzedLabel ? (
                <p className="mb-3 px-1 text-center text-sm text-slate-600 dark:text-slate-300">{lastAnalyzedLabel}</p>
              ) : null}

              <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2.5 rounded-full bg-[#346DE0] transition-all duration-1000 ease-out" style={{ width: `${score}%` }} />
              </div>

              <button type="button" onClick={handleReanalyze} disabled={analyzeMutation.isPending} className={PRIMARY_CTA_CLASS}>
                <RefreshCw size={12} className={analyzeMutation.isPending ? "animate-spin" : ""} aria-hidden />
                {analyzeMutation.isPending ? "Analyzing..." : "Re-Analyze"}
              </button>
            </div>

            {mutationErrorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-300">
                {mutationErrorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
              <h2 className="text-base font-semibold leading-tight text-slate-900 dark:text-white">Content Lab</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {hasScheduledPosts
                  ? `${scheduledPosts.length} post${scheduledPosts.length === 1 ? "" : "s"} scheduled — draft and schedule more from Studio.`
                  : "No posts in 12 days — draft posts and schedule from one place."}
              </p>
              <div className="mt-3">
                {hasScheduledPosts ? (
                  <button type="button" onClick={() => setShowScheduledModal(true)} className={TEXT_LINK_CTA_CLASS}>
                    View scheduled posts
                  </button>
                ) : (
                  <button type="button" onClick={goToStudio} className={PRIMARY_CTA_CLASS}>
                    Open Content Lab
                  </button>
                )}
              </div>

              {!hasScheduledPosts ? (
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-2 flex items-center gap-2">
                    <StudioSectionDot />
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Scheduled posts</h3>
                  </div>
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                    Nothing scheduled yet. Open Content Lab to draft and schedule a post.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111]">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Connection request</h3>
              {connectionGenerateError ? <p className="mb-3 text-xs text-red-600 dark:text-red-400">{connectionGenerateError}</p> : null}
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                  placeholder="Their name"
                  value={connectionRecipientName}
                  onChange={e => setConnectionRecipientName(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                  placeholder="Designation (e.g. Product Lead at Stripe)"
                  value={connectionRecipientDesignation}
                  onChange={e => setConnectionRecipientDesignation(e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void generateConnectionRequest()}
                  disabled={!connectionRecipientName.trim() || !connectionRecipientDesignation.trim() || isGeneratingConnection}
                  className={BLUE_PRIMARY_CTA_CLASS}
                >
                  {isGeneratingConnection ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" aria-hidden /> Generating…
                    </>
                  ) : (
                    "Generate connection request"
                  )}
                </button>
              </div>
              {generatedConnectionRequest ? (
                <>
                  <div className="relative mt-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3 pt-3 pr-10 dark:border-slate-700 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(generatedConnectionRequest)}
                      className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-[#346DE0] dark:hover:text-blue-400"
                      aria-label="Copy connection request"
                      title="Copy"
                    >
                      <Copy size={14} strokeWidth={2} className="fill-none" aria-hidden />
                    </button>
                    <label className="sr-only">Connection request draft</label>
                    <textarea
                      value={generatedConnectionRequest}
                      onChange={e => setGeneratedConnectionRequest(e.target.value)}
                      rows={Math.max(4, generatedConnectionRequest.split("\n").length)}
                      className="block w-full resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-slate-700 shadow-none outline-none ring-0 focus:ring-0 dark:text-slate-300"
                    />
                  </div>
                  <button type="button" onClick={openConnectionGenerateMore} className={`mt-2 ${TEXT_LINK_PLAIN_CLASS}`}>
                    Generate more
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showScheduledModal ? (
        <LinkedInScheduledPostsModal
          posts={scheduledPosts}
          onClose={() => setShowScheduledModal(false)}
          onPostClick={() => {
            setShowScheduledModal(false);
            goToStudio();
          }}
          onDeletePost={id => {
            void (async () => {
              try {
                await deleteContentGenAsset(String(id));
                await queryClient.invalidateQueries({ queryKey: linkedinScheduledPostsQueryKey });
              } catch {
                // ignore — modal list will refresh on next navigation
              }
            })();
          }}
        />
      ) : null}
    </div>
  );
};

export default LinkedInDashboard;
