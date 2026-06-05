import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Linkedin, Download, RefreshCw, ChevronDown, Copy, ExternalLink, X } from 'lucide-react';
import type { UnibotImproveRequestDetail } from '@/types';
import type { GeneratorContext } from '@/types/jobs';
import { type LinkedInListItem } from '@/components/studio/LinkedInPostListCard';
import StudioSectionDot from '@/components/studio/StudioSectionDot';
import LinkedInScheduledPostsModal from '@/components/LinkedInScheduledPostsModal';

const MOCK_SCHEDULED_POSTS: LinkedInListItem[] = [
    { id: 's1', content: "Just finished a great workshop on Design Systems! 🎨 #UX #Design", date: 'Tomorrow, 10:00 AM' },
    { id: 's2', content: 'Looking for recommendations on the best prototyping tools for 2024. 👇', date: 'Fri, 2:00 PM' },
];

/** Matches Jobs “Apply Now” (JobCard) — dark navy */
const PRIMARY_CTA_CLASS =
    'w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all active:scale-95 shadow-sm disabled:pointer-events-none disabled:opacity-40 dark:bg-slate-900 dark:hover:bg-slate-800';

const BLUE_PRIMARY_CTA_CLASS =
    'w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#346DE0] hover:bg-[#254DB3] text-white rounded-xl text-xs font-medium transition-all active:scale-95 shadow-md shadow-blue-500/20 disabled:pointer-events-none disabled:opacity-40';

const TEXT_LINK_CTA_CLASS =
    'text-xs font-medium text-[#346DE0] underline underline-offset-2 transition-colors hover:text-[#254DB3] dark:text-blue-400 dark:hover:text-blue-300';

const TEXT_LINK_PLAIN_CLASS =
    'text-xs font-medium text-[#346DE0] transition-colors hover:text-[#254DB3] dark:text-blue-400 dark:hover:text-blue-300';

interface LinkedInDashboardProps {
    onImprove: (detail: UnibotImproveRequestDetail) => void;
    onNavigateToStudio?: (context: GeneratorContext) => void;
}

const LinkedInDashboard: React.FC<LinkedInDashboardProps> = ({ onImprove, onNavigateToStudio }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [score, setScore] = useState(65);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [connectionMsg, setConnectionMsg] = useState('');

    const [scheduledPosts, setScheduledPosts] = useState<LinkedInListItem[]>(MOCK_SCHEDULED_POSTS);
    const [showScheduledModal, setShowScheduledModal] = useState(false);
    const hasScheduledPosts = scheduledPosts.length > 0;

    // Connection Request Generator State
    const [connectionRecipientName, setConnectionRecipientName] = useState('');
    const [connectionRecipientDesignation, setConnectionRecipientDesignation] = useState('');
    const [generatedConnectionRequest, setGeneratedConnectionRequest] = useState('');
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const [profileBreakdownOpen, setProfileBreakdownOpen] = useState(true);

    // Mock Data
    const profileSections = [
        { id: 'pic', name: 'Profile Picture', status: 'good', score: 90, feedback: 'Professional and clear.' },
        { id: 'cover', name: 'Cover Picture', status: 'warning', score: 60, feedback: 'Generic image. Add branding.' },
        { id: 'headline', name: 'Headline', status: 'good', score: 85, feedback: 'Strong keywords used.' },
        { id: 'about', name: 'About Section', status: 'warning', score: 50, feedback: 'Too short. Tell your story.' },
        { id: 'exp', name: 'Experience', status: 'good', score: 80, feedback: 'Detailed descriptions.' },
        { id: 'skills', name: 'Skills', status: 'critical', score: 40, feedback: 'Missing key industry skills.' },
    ];

    const suggestedProfiles = [
        { id: 1, name: "Sarah Lin", title: "Product Design Lead at Airbnb", avatar: "SL" },
        { id: 2, name: "David Chen", title: "Head of Engineering at Stripe", avatar: "DC" },
        { id: 3, name: "Maria Garcia", title: "Talent Acquisition at Google", avatar: "MG" },
    ];

    const handleConnect = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            setIsConnected(true);
        }, 2000);
    };

    const handleReanalyze = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setScore(prev => Math.min(prev + 5, 100)); // Simulate improvement
            setIsAnalyzing(false);
        }, 1500);
    };

    const openConnectionModal = (profile: any) => {
        setSelectedProfile(profile);
        setConnectionMsg(`Hi ${profile.name.split(' ')[0]},\n\nI've been following your work at ${profile.title.split(' at ')[1]} and would love to connect. Your recent posts on product design really resonated with me.\n\nBest,\n[Your Name]`);
        setShowConnectionModal(true);
    };

    const generateConnectionRequest = () => {
        const name = connectionRecipientName.trim();
        const designation = connectionRecipientDesignation.trim();
        if (!name || !designation) return;
        const first = name.split(/\s+/)[0] ?? name;
        setGeneratedConnectionRequest(
            `Hi ${first},\n\nI came across your profile on LinkedIn and really admire the work you're doing as ${designation}. I'd love to connect and learn from your experience.\n\nBest,\n[Your Name]`
        );
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
            type: "linkedin",
            topicTitle: "LinkedIn · Connection request",
            text: `[Connection request generator — follow-up]\n\nRecipient name: ${connectionRecipientName.trim() || "—"}\nDesignation / role: ${connectionRecipientDesignation.trim() || "—"}\n\nCurrent draft:\n${generatedConnectionRequest}\n\nPlease generate alternative LinkedIn connection request notes (different angles, warm and professional). Keep each under 300 characters where possible.`,
        });
    };

    if (!isConnected) {
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
                        onClick={handleConnect}
                        disabled={isAnalyzing}
                        className="w-full py-3.5 bg-[#346DE0] hover:bg-[#254DB3] text-white font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw size={20} className="animate-spin" /> Analyzing Profile...
                            </>
                        ) : (
                            "Connect & Analyze"
                        )}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-medium">Secure connection via OAuth 2.0</p>
                </div>
            </div>
        );
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

            {/* Sticky Extension CTA */}
            <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-1.5 rounded-lg">
                        <Download size={16} className="text-blue-400" />
                    </div>
                    <span className="text-sm font-medium" style={{ fontFamily: 'Onest, sans-serif' }}>
                        Get the <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 animate-gradient-x">Unimad LinkedIn Optimiser</span> for Chrome/Brave
                    </span>
                </div>
                <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors">
                    Add to Chrome
                </button>
            </div>

            <div className="max-w-6xl mx-auto p-8 space-y-8">



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* LEFT COLUMN: Profile Breakdown (66%) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111]">
                            <div className="border-b border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    aria-expanded={profileBreakdownOpen}
                                    onClick={() => setProfileBreakdownOpen((o) => !o)}
                                    className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                >
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-normal text-slate-900 dark:text-white">Profile breakdown</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Detailed analysis of your profile sections with actionable tips.
                                        </p>
                                    </div>
                                    <ChevronDown
                                        size={22}
                                        className={`mt-1 shrink-0 text-slate-400 transition-transform duration-200 ${profileBreakdownOpen ? "rotate-180" : ""}`}
                                        aria-hidden
                                    />
                                </button>
                                {profileBreakdownOpen ? (
                                    <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                                        {profileSections.map((section) => (
                                            <div key={section.id} className="flex items-start gap-5 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                                                        <div className="relative shrink-0 group">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onImprove({
                                                                        text: `I'm on the LinkedIn page working on **${section.name}** (score ${section.score}%).\n\nCurrent feedback: ${section.feedback}\n\nPlease suggest concrete improvements and, if helpful, example wording tailored to this section.`,
                                                                        topicTitle: `LinkedIn · ${section.name}`,
                                                                        type: "linkedin",
                                                                    })
                                                                }
                                                                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#346DE0] transition-colors hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                                            >
                                                                <span>Improve</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="mb-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{section.feedback}</p>
                                                    <p className="text-xs italic text-slate-400 dark:text-slate-500">
                                                        Tip:{" "}
                                                        {section.score > 80
                                                            ? "Maintain this quality by updating regularly."
                                                            : "Add more industry-specific keywords to boost visibility."}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <div className="border-t border-slate-100 p-6 dark:border-slate-800">
                                <Link
                                    href="/uniboard/unicoach"
                                    className="relative block w-full overflow-hidden rounded-xl border border-[#0a66c2]/25 bg-[#0a66c2] transition-opacity hover:opacity-95"
                                >
                                    <span
                                        className="linkedin-unicoach-cta-shimmer pointer-events-none absolute inset-0"
                                        aria-hidden
                                    />
                                    <span className="relative z-10 flex w-full items-center justify-center px-4 py-2.5 text-xs font-medium text-white">
                                        Get expert advice with Unicoach
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Stacked Widgets (33%) */}
                    <div className="space-y-6">

                        {/* 1. Score Widget (Condensed) */}
                        <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center">
                            {/* Avatar Display */}
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-black shadow-lg overflow-hidden relative z-10">
                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="font-medium text-2xl text-slate-400">me</span>
                                    </div>
                                </div>
                                {/* Optional: Decorative ring behind avatar if desired, or just clean */}
                                <div className="absolute inset-0 rounded-full border border-slate-200 dark:border-slate-800 scale-110 -z-0"></div>
                            </div>

                            <h2 className="font-medium text-slate-900 dark:text-white mb-1">Profile Strength</h2>
                            <span className="text-2xl font-medium text-[#346DE0] mb-3">{score}/100</span>

                            {/* Horizontal Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                                <div
                                    className="bg-[#346DE0] h-2.5 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>

                            <button
                                onClick={handleReanalyze}
                                disabled={isAnalyzing}
                                className={PRIMARY_CTA_CLASS}
                            >
                                <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                                {isAnalyzing ? "Analyzing..." : "Re-Analyze"}
                            </button>
                        </div>

                        {/* Content Lab + scheduled (single box) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
                            <h2 className="text-base font-semibold leading-tight text-slate-900 dark:text-white">
                                Content Lab
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {hasScheduledPosts
                                    ? `${scheduledPosts.length} post${scheduledPosts.length === 1 ? '' : 's'} scheduled — draft and schedule more from Studio.`
                                    : 'No posts in 12 days — draft posts and schedule from one place.'}
                            </p>
                            <div className="mt-3">
                                {hasScheduledPosts ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduledModal(true)}
                                        className={TEXT_LINK_CTA_CLASS}
                                    >
                                        View scheduled posts
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateToStudio?.({ type: 'linkedin-post' })}
                                        className={PRIMARY_CTA_CLASS}
                                    >
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

                        {/* Connection request */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111]">
                            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Connection request</h3>
                            <div className="space-y-3">
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                                    placeholder="Their name"
                                    value={connectionRecipientName}
                                    onChange={(e) => setConnectionRecipientName(e.target.value)}
                                    autoComplete="off"
                                />
                                <input
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                                    placeholder="Designation (e.g. Product Lead at Stripe)"
                                    value={connectionRecipientDesignation}
                                    onChange={(e) => setConnectionRecipientDesignation(e.target.value)}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={generateConnectionRequest}
                                    disabled={!connectionRecipientName.trim() || !connectionRecipientDesignation.trim()}
                                    className={BLUE_PRIMARY_CTA_CLASS}
                                >
                                    Generate connection request
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
                                            onChange={(e) => setGeneratedConnectionRequest(e.target.value)}
                                            rows={Math.max(4, generatedConnectionRequest.split('\n').length)}
                                            className="block w-full resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-slate-700 shadow-none outline-none ring-0 [field-sizing:content] focus:ring-0 dark:text-slate-300"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openConnectionGenerateMore}
                                        className={`mt-2 ${TEXT_LINK_PLAIN_CLASS}`}
                                    >
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
                        onNavigateToStudio?.({ type: 'linkedin-post' });
                    }}
                    onDeletePost={(id) => setScheduledPosts((prev) => prev.filter((p) => p.id !== id))}
                />
            ) : null}

            {/* Connection Request Modal */}
            {
                showConnectionModal && selectedProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <Linkedin size={18} className="text-[#346DE0]" /> Connect with {selectedProfile.name}
                                </h3>
                                <button onClick={() => setShowConnectionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-6">
                                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Personalized Note</label>
                                <textarea
                                    value={connectionMsg}
                                    onChange={(e) => setConnectionMsg(e.target.value)}
                                    className="min-h-[200px] w-full resize-y p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-sm leading-relaxed mb-4 focus:border-blue-500 outline-none"
                                />
                                <div className="flex gap-3">
                                    <button className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm" onClick={() => void copyToClipboard(connectionMsg)}>
                                        Copy Text
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-[#346DE0] hover:bg-[#254DB3] text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                                        onClick={() => {
                                            alert(`Opened LinkedIn profile for ${selectedProfile.name}`);
                                            setShowConnectionModal(false);
                                        }}
                                    >
                                        Open LinkedIn <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .linkedin-unicoach-cta-shimmer {
                    width: 40%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.08) 40%,
                        rgba(255, 255, 255, 0.22) 50%,
                        rgba(255, 255, 255, 0.08) 60%,
                        transparent
                    );
                    transform: translateX(-160%) skewX(-12deg);
                    animation: linkedinUnicoachCtaShimmer 10s ease-in-out infinite;
                }

                @keyframes linkedinUnicoachCtaShimmer {
                    0%,
                    84%,
                    100% {
                        transform: translateX(-160%) skewX(-12deg);
                    }
                    16% {
                        transform: translateX(380%) skewX(-12deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default LinkedInDashboard;
