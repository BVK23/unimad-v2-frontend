import React, { useState, useEffect } from "react";
import {
  Linkedin,
  Download,
  Star,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  UserPlus,
  Copy,
  ExternalLink,
  Check,
  X,
  Send,
} from "lucide-react";

interface LinkedInDashboardProps {
  onImprove: (text: string) => void;
}

const LinkedInDashboard: React.FC<LinkedInDashboardProps> = ({ onImprove }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState(65);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [connectionMsg, setConnectionMsg] = useState("");

  // Comment Generator State
  const [postLink, setPostLink] = useState("");
  const [generatedComment, setGeneratedComment] = useState("");

  // Connection Request Generator State
  const [connectionLink, setConnectionLink] = useState("");
  const [generatedConnectionRequest, setGeneratedConnectionRequest] = useState("");

  // Mock Data
  const profileSections = [
    { id: "pic", name: "Profile Picture", status: "good", score: 90, feedback: "Professional and clear." },
    { id: "cover", name: "Cover Picture", status: "warning", score: 60, feedback: "Generic image. Add branding." },
    { id: "headline", name: "Headline", status: "good", score: 85, feedback: "Strong keywords used." },
    { id: "about", name: "About Section", status: "warning", score: 50, feedback: "Too short. Tell your story." },
    { id: "exp", name: "Experience", status: "good", score: 80, feedback: "Detailed descriptions." },
    { id: "skills", name: "Skills", status: "critical", score: 40, feedback: "Missing key industry skills." },
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
    setConnectionMsg(
      `Hi ${profile.name.split(" ")[0]},\n\nI've been following your work at ${profile.title.split(" at ")[1]} and would love to connect. Your recent posts on product design really resonated with me.\n\nBest,\n[Your Name]`
    );
    setShowConnectionModal(true);
  };

  const generateComment = () => {
    if (!postLink) return;
    setGeneratedComment(
      "This is a great insight! I completely agree that consistency is key in long-term growth. Thanks for sharing this perspective."
    );
  };

  const generateConnectionRequest = () => {
    if (!connectionLink) return;
    setGeneratedConnectionRequest(
      "Hi [Name], I've been following your work and would love to connect to learn more about your journey in [Industry]. Best, [Your Name]"
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
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
      {/* Sticky Extension CTA */}
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
        <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors">
          Add to Chrome
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: Profile Breakdown (66%) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-normal text-xl text-slate-900 dark:text-white">Profile Breakdown</h3>
                <p className="text-sm text-slate-500 mt-1">Detailed analysis of your profile sections with actionable tips.</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {profileSections.map(section => (
                  <div
                    key={section.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-5"
                  >
                    {/* Circular Progress */}
                    <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-base text-slate-900 dark:text-white">{section.name}</h4>
                        <div className="relative group">
                          <button
                            onClick={() =>
                              onImprove(`Help me improve my LinkedIn ${section.name}. The current feedback is: ${section.feedback}`)
                            }
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                          >
                            <span className="text-xs">Improve</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{section.feedback}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Tip:{" "}
                        {section.score > 80
                          ? "Maintain this quality by updating regularly."
                          : "Add more industry-specific keywords to boost visibility."}
                      </p>
                    </div>
                  </div>
                ))}
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
                <div className="bg-[#346DE0] h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%` }}></div>
              </div>

              <button
                onClick={handleReanalyze}
                disabled={isAnalyzing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#346DE0] hover:bg-[#254DB3] text-white rounded-xl text-xs font-medium transition-all active:scale-95 shadow-md shadow-blue-500/20"
              >
                <RefreshCw size={12} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Analyzing..." : "Re-Analyze"}
              </button>
            </div>

            {/* 2. Recent Activity Widget (New Design) */}
            <div className="bg-[#080C15] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-slate-800">
              {/* SVG Background */}
              <div className="absolute inset-0 z-0">
                <svg
                  className="w-full h-full object-cover"
                  preserveAspectRatio="none"
                  viewBox="0 0 2424 868"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_recent_activity)">
                    <rect width="2424" height="868" fill="#080C15" />
                    <g style={{ mixBlendMode: "hard-light" }} filter="url(#filter0_f_recent_activity)">
                      <path
                        d="M2956.25 917.841C3835.35 844.561 708.705 1687.33 1692.56 861.984C2676.42 36.6427 1075.48 723.355 838.766 385.629C602.05 47.9029 1069.29 516.956 1837.92 161.64C2606.54 -193.676 2077.16 991.12 2956.25 917.841Z"
                        fill="url(#paint0_linear_recent_activity)"
                      />
                    </g>
                    <g style={{ mixBlendMode: "lighten" }} opacity="0.01" filter="url(#filter1_f_recent_activity)">
                      <path
                        d="M3165.25 754.568C4044.35 681.223 917.705 1524.73 1901.56 698.662C2885.42 -127.409 1284.48 559.91 1047.77 221.886C811.05 -116.139 1278.29 353.328 2046.92 -2.30108C2815.54 -357.931 2286.16 827.912 3165.25 754.568Z"
                        fill="url(#paint1_linear_recent_activity)"
                      />
                    </g>
                    <g style={{ mixBlendMode: "color-dodge" }} opacity="0.37" filter="url(#filter2_fn_recent_activity)">
                      <path
                        d="M2858.25 998.568C3737.35 925.223 610.705 1768.73 1594.56 942.662C2578.42 116.591 977.481 803.91 740.766 465.886C504.05 127.861 971.289 597.328 1739.92 241.699C2508.54 -113.931 1979.16 1071.91 2858.25 998.568Z"
                        fill="url(#paint2_linear_recent_activity)"
                      />
                    </g>
                  </g>
                  <defs>
                    <filter
                      id="filter0_f_recent_activity"
                      x="610"
                      y="-72"
                      width="2671"
                      height="1466"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="83.5" result="effect1_foregroundBlur_recent_activity" />
                    </filter>
                    <filter
                      id="filter1_f_recent_activity"
                      x="819"
                      y="-236"
                      width="2671"
                      height="1467"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="83.5" result="effect1_foregroundBlur_recent_activity" />
                    </filter>
                    <filter
                      id="filter2_fn_recent_activity"
                      x="579"
                      y="75"
                      width="2537"
                      height="1333"
                      filterUnits="userSpaceOnUse"
                      colorInterpolationFilters="sRGB"
                    >
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                      <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_recent_activity" />
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="2 2"
                        stitchTiles="stitch"
                        numOctaves="3"
                        result="noise"
                        seed="6081"
                      />
                      <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
                      <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                        <feFuncA
                          type="discrete"
                          tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
                        />
                      </feComponentTransfer>
                      <feComposite operator="in" in2="effect1_foregroundBlur_recent_activity" in="coloredNoise1" result="noise1Clipped" />
                      <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
                      <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
                      <feMerge result="effect2_noise_recent_activity">
                        <feMergeNode in="effect1_foregroundBlur_recent_activity" />
                        <feMergeNode in="color1" />
                      </feMerge>
                    </filter>
                    <linearGradient
                      id="paint0_linear_recent_activity"
                      x1="2172.8"
                      y1="1791.58"
                      x2="2086.08"
                      y2="-29.7205"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0.173077" stopColor="#346DE0" />
                      <stop offset="1" stopColor="#67DEFF" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_recent_activity"
                      x1="2381.8"
                      y1="1629.08"
                      x2="2294.93"
                      y2="-193.823"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0.173077" stopColor="#346DE0" />
                      <stop offset="1" stopColor="#67DEFF" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_recent_activity"
                      x1="2074.8"
                      y1="1873.08"
                      x2="1987.93"
                      y2="50.1766"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0.173077" stopColor="#346DE0" />
                      <stop offset="1" stopColor="#67DEFF" />
                    </linearGradient>
                    <clipPath id="clip0_recent_activity">
                      <rect width="2424" height="868" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>

              <div className="relative z-10">
                <h3 className="font-semibold text-lg text-white mb-2">Recent Activity</h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed max-w-[90%]">
                  No posts in 12 days. Schedule a post to boost engagement by 20%.
                </p>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95 flex justify-center items-center gap-2">
                  <Send size={16} /> Go to Content Lab
                </button>
              </div>
            </div>

            {/* 3. Comment Generator */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-6">
              <h3 className="font-medium text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">Comment Generator</h3>
              <div className="bg-white dark:bg-black rounded-xl p-1 border border-blue-100 dark:border-blue-900/50 flex mb-3">
                <input
                  className="flex-1 bg-transparent px-3 py-2 text-xs outline-none dark:text-white"
                  placeholder="Paste Post URL..."
                  value={postLink}
                  onChange={e => setPostLink(e.target.value)}
                />
                <button
                  onClick={generateComment}
                  className="bg-[#346DE0] hover:bg-[#254DB3] text-white rounded-lg px-2 flex items-center justify-center transition-colors shadow-sm"
                >
                  <span className="text-[10px] font-bold">GEN</span>
                </button>
              </div>
              {generatedComment && (
                <div className="bg-white/80 dark:bg-black/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 italic mb-2 leading-relaxed">
                    &quot;{generatedComment}&quot;
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatedComment)}
                    className="w-full py-1 flex items-center justify-center gap-2 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
              )}
            </div>

            {/* 4. Connection Request Generator (New) */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-6">
              <h3 className="font-medium text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                Generate Connection Request
              </h3>
              <div className="bg-white dark:bg-black rounded-xl p-1 border border-blue-100 dark:border-blue-900/50 flex mb-3">
                <input
                  className="flex-1 bg-transparent px-3 py-2 text-xs outline-none dark:text-white"
                  placeholder="Paste Profile URL..."
                  value={connectionLink}
                  onChange={e => setConnectionLink(e.target.value)}
                />
                <button
                  onClick={generateConnectionRequest}
                  className="bg-[#346DE0] hover:bg-[#254DB3] text-white rounded-lg px-2 flex items-center justify-center transition-colors shadow-sm"
                >
                  <UserPlus size={12} />
                </button>
              </div>
              {generatedConnectionRequest && (
                <div className="bg-white/80 dark:bg-black/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 italic mb-2 leading-relaxed">
                    &quot;{generatedConnectionRequest}&quot;
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatedConnectionRequest)}
                    className="w-full py-1 flex items-center justify-center gap-2 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Linkedin size={18} className="text-[#346DE0]" /> Connect with {selectedProfile.name}
              </h3>
              <button onClick={() => setShowConnectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Personalized Note</label>
              <textarea
                value={connectionMsg}
                onChange={e => setConnectionMsg(e.target.value)}
                className="w-full h-32 p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-sm mb-4 focus:border-blue-500 outline-none resize-none"
              />
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm"
                  onClick={() => copyToClipboard(connectionMsg)}
                >
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
      )}
    </div>
  );
};

export default LinkedInDashboard;
