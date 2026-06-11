import React, { useState, useEffect } from "react";
import {
  Copy,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  MoreHorizontal,
  Globe,
  Wand2,
  ExternalLink,
  Download,
  Plus,
  FileText,
  ChevronLeft,
  Calendar,
  Clock,
  History,
  Trash2,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { GeneratorContext } from "../../types/jobs";
import AllPostsModal from "./AllPostsModal";
import { LinkedInListItem } from "./LinkedInPostListCard";
import PostSchedulerModal from "./PostSchedulerModal";
import VPDEditor from "./VPDEditor";

interface StudioMainProps {
  initialContext?: GeneratorContext | null;
}

const TOPICS = [
  { id: "linkedin-post", label: "LinkedIn Post" },
  { id: "cover-letter", label: "Cover Letter" },
  { id: "cold-email", label: "Cold Email" },
  { id: "referral", label: "Referral Request" },
  { id: "vpd", label: "Value Prop Doc" },
];

const MOODS = ["Professional", "Casual", "Enthusiastic", "Thought Leadership", "Storytelling"];
const CONTENT_TYPES = ["Career Update", "Industry Insight", "Personal Story", "Project Showcase", "Advice"];

// Mock Previous VPDs
const MOCK_VPDS = [
  { id: 1, title: "Product Designer @ Google", date: "2 days ago" },
  { id: 2, title: "UX Researcher @ Spotify", date: "1 week ago" },
];

// Mock Scheduled Posts
const MOCK_SCHEDULED = [
  { id: 1, content: "Just finished a great workshop on Design Systems! 🎨 #UX #Design", date: "Tomorrow, 10:00 AM" },
  { id: 2, content: "Looking for recommendations on the best prototyping tools for 2024. 👇", date: "Fri, 2:00 PM" },
];

// Mock History
const MOCK_HISTORY = [
  {
    id: 101,
    content: "Excited to share that I've joined Unimad as a Product Designer! 🚀",
    stats: "1.2k views • 45 likes",
    date: "2 days ago",
  },
  { id: 102, content: "My top 3 takeaways from Config 2023. A thread 🧵", stats: "3.5k views • 120 likes", date: "1 week ago" },
];

type SelectedPostData = LinkedInListItem & { isScheduled?: boolean; stats?: string };

const StudioMain: React.FC<StudioMainProps> = ({ initialContext }) => {
  // Force refresh check
  const [selectedTopic, setSelectedTopic] = useState<string>("linkedin-post");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // LinkedIn specific state
  const [mood, setMood] = useState("Professional");
  const [contentType, setContentType] = useState("Career Update");
  const [topicIdea, setTopicIdea] = useState("");

  // Specific Form States
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [managerName, setManagerName] = useState("");
  const [connectionName, setConnectionName] = useState("");

  // VPD Specific State
  const [vpdMode, setVpdMode] = useState<"list" | "create">("list");

  // Scheduler State
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<LinkedInListItem[]>(MOCK_SCHEDULED);
  const [postHistory, setPostHistory] = useState<Array<LinkedInListItem & { stats?: string }>>(MOCK_HISTORY);

  // "All Posts" Modal State
  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [allPostsInitialTab, setAllPostsInitialTab] = useState<"scheduled" | "history">("scheduled");

  // Edit/View Post State
  const [selectedPostData, setSelectedPostData] = useState<SelectedPostData | null>(null); // For editing/viewing existing posts

  // Initialize/Reset — sync generator context from jobs deep-link into local form state
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-way sync when initialContext is set from navigation */
    if (initialContext) {
      setSelectedTopic(initialContext.type);
      setRole(initialContext.role || "");
      setCompany(initialContext.company || "");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    if (selectedTopic === "vpd") setVpdMode("list");
  }, [initialContext, selectedTopic]);

  const handlePost = (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => {
    // Optimistic update for demo purposes
    // In real app, we might check if we are UPDATING an existing post (selectedPostData) or creating NEW

    if (isScheduled && scheduleDate) {
      // Add to scheduled
      const newScheduled = {
        id: selectedPostData?.id || Date.now(), // Keep ID if editing
        content: finalContent,
        date: scheduleDate.toLocaleString(),
      };

      if (selectedPostData?.isScheduled) {
        // Update existing
        setScheduledPosts(scheduledPosts.map(p => (p.id === newScheduled.id ? newScheduled : p)));
      } else {
        // Add new
        setScheduledPosts([newScheduled, ...scheduledPosts]);
      }
    } else {
      // Add to history
      const newPost = {
        id: Date.now(), // History always new entry effectively? Or update if editing draft? Let's say new for now.
        content: finalContent,
        stats: "0 views • 0 likes",
        date: "Just now",
      };
      setPostHistory([newPost, ...postHistory]);
    }
    setShowScheduler(false);
    setSelectedPostData(null); // Clear selected data
  };

  const handlePostClick = (post: LinkedInListItem, type: "scheduled" | "history") => {
    // Open modal with data
    setGeneratedContent(post.content); // Pre-fill content

    // Prepare initial data for modal
    let initialData = undefined;
    if (type === "scheduled") {
      // Parse date string (very basic parsing for mock)
      // Mock date string is "Tomorrow, 10:00 AM" etc. real app would have ISO dates.
      // For this UI demo, we'll just pass a dummy date or try to parse if possible, or just boolean.
      initialData = { isScheduled: true, date: new Date() };
    } else {
      initialData = { isScheduled: false };
    }

    setSelectedPostData({ ...post, isScheduled: type === "scheduled" });
    setShowScheduler(true);
  };

  const handleViewAll = (tab: "scheduled" | "history") => {
    setAllPostsInitialTab(tab);
    setShowAllPostsModal(true);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const content = generateMockContent();
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 1500);
  };

  const generateMockContent = () => {
    if (selectedTopic === "linkedin-post") {
      return `🚀 Excited to announce my next chapter!\n\nI'm thrilled to share that I'm diving deeper into Product Design. The journey hasn't been valid linear, but every step taught me something valuable about user empathy and systems thinking.\n\nBig thanks to everyone who supported me along the way. Can't wait to build amazing things! 🎨✨\n\n#ProductDesign #CareerUpdate #NewBeginnings #UX`;
    }
    if (selectedTopic === "cover-letter") {
      return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role || "[Role]"} position at ${company || "[Company]"}. Having followed ${company || "[Company]"}'s work in...`;
    }
    if (selectedTopic === "cold-email") {
      return `Hi ${managerName || "[Manager Name]"},\n\nI've been following the work your team is doing at ${company || "[Company]"} and I'm impressed by...\n\nI'm a ${role || "[Role]"} with experience in...`;
    }
    if (selectedTopic === "referral") {
      return `Hi ${connectionName || "[Name]"},\n\nI hope you're doing well! I saw an opening for ${role || "[Role]"} at ${company || "[Company]"} and was wondering if you could share some insights...`;
    }
    return `Title: Value Proposition Document\nRole: ${role}\nCompany: ${company}\n\n1. Core Strengths...\n2. Relevant Experience...\n3. Why Me?`;
  };

  const renderInputs = () => {
    // VPD Handling
    if (selectedTopic === "vpd") {
      if (vpdMode === "list") {
        return (
          <div className="space-y-4">
            <button
              onClick={() => setVpdMode("create")}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-brand-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-medium"
            >
              <Plus size={24} />
              <span>Create New VPD</span>
            </button>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-3">Previously Created</label>
              <div className="space-y-2">
                {MOCK_VPDS.map(vpd => (
                  <div
                    key={vpd.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:border-brand-500 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">{vpd.title}</h4>
                      <p className="text-xs text-slate-500">{vpd.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      // VPD Create Mode (Falls through to shared Inputs below)
    }

    return (
      <div className="space-y-5">
        {selectedTopic === "vpd" && (
          <button onClick={() => setVpdMode("list")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2">
            <ChevronLeft size={14} /> Back to List
          </button>
        )}

        {/* LinkedIn Inputs */}
        {selectedTopic === "linkedin-post" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Topic Generator</label>
              <div className="flex gap-2">
                <input
                  value={topicIdea}
                  onChange={e => setTopicIdea(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="e.g. Learnings from my first design sprint..."
                />
                <button className="px-4 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors font-medium">
                  <Wand2 size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Mood</label>
                <select
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none bg-white dark:bg-slate-900"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Content Type</label>
                <input
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="e.g. Career Update"
                />
              </div>
            </div>

            {/* Media Upload Options */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Media Attachment</label>
              <button className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-medium">Click to upload media</span>
              </button>
            </div>
          </>
        )}

        {/* LinkedIn: History & Scheduled (Only show when not generating) */}
        {selectedTopic === "linkedin-post" && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
            {/* Scheduled Section */}
            {/* Scheduled Section */}
            {/* Scheduled Section - Refined */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleViewAll("scheduled")}
                className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md cursor-pointer transition-all h-full"
              >
                <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                  <Calendar size={20} />
                </div>
                <span className="text-base font-semibold text-slate-900">Scheduled</span>
                <span className="text-sm text-slate-500 mt-1 font-normal">{scheduledPosts.length} posts</span>
              </button>

              <button
                onClick={() => handleViewAll("history")}
                className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md cursor-pointer transition-all h-full"
              >
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                  <History size={20} />
                </div>
                <span className="text-base font-semibold text-slate-900">History</span>
                <span className="text-sm text-slate-500 mt-1 font-normal">{postHistory.length} posts</span>
              </button>
            </div>
          </div>
        )}

        {/* Shared Inputs (Role, Company) for Non-LinkedIn */}
        {selectedTopic !== "linkedin-post" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="e.g. Product Designer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="e.g. Spotify"
              />
            </div>
          </div>
        )}

        {/* Specific 3rd Inputs */}
        {(selectedTopic === "cover-letter" || selectedTopic === "vpd") && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Paste the JD here..."
            />
          </div>
        )}

        {selectedTopic === "cold-email" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Hiring Manager Name</label>
            <input
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="e.g. John Doe"
            />
          </div>
        )}

        {selectedTopic === "referral" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Connection Name</label>
            <input
              value={connectionName}
              onChange={e => setConnectionName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="e.g. Jane Smith"
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {isGenerating ? <Wand2 size={18} className="animate-spin" /> : <Wand2 size={18} fill="currentColor" />}
          {isGenerating ? " crafting..." : "Generate Draft"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 h-full overflow-hidden font-sans flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Input / Generator */}
        <div className="w-full lg:w-[45%] h-1/2 lg:h-full bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-8 overflow-y-auto">
          <div className="mb-8">
            {/* Typography Update: 20px Header, 14px Subtext */}
            <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white mb-2 font-['Onest']">Content Lab (UPDATED)</h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400">Generate high-quality application materials in seconds.</p>
          </div>

          {renderInputs()}
        </div>

        {/* RIGHT: Preview + Tabs */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col relative">
          {/* Top Bar for Tabs - Sticky */}
          <div className="w-full px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950 backdrop-blur-sm sticky top-0 z-20">
            {/* Pill Tabs - Fully Rounded */}
            <div className="inline-flex p-1 bg-slate-200/50 dark:bg-slate-900 rounded-full">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`
                                        px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                        ${
                                          selectedTopic === t.id
                                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        }
                                    `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
            <div className="w-full max-w-2xl relative group/preview">
              {/* Improve / Actions */}
              <div className="absolute -top-12 right-0 opacity-0 group-hover/preview:opacity-100 transition-opacity flex gap-2">
                {selectedTopic === "cover-letter" && (
                  <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all">
                    <Download size={14} /> PDF
                  </button>
                )}
                {selectedTopic === "linkedin-post" && (
                  <button
                    onClick={() => {
                      setGeneratedContent(generatedContent); // Ensure current content is passed
                      setSelectedPostData(null); // Ensure it's treated as new
                      setShowScheduler(true);
                    }}
                    className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all"
                  >
                    <Send size={14} /> Schedule / Post
                  </button>
                )}
              </div>
              {/* Conditional Preview Rendering */}
              {selectedTopic === "vpd" && vpdMode === "create" ? (
                <div className="absolute inset-0 bg-white dark:bg-slate-950 z-10 flex flex-col">
                  <VPDEditor />
                </div>
              ) : selectedTopic === "linkedin-post" ? (
                /* LinkedIn Card Preview */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-medium text-lg shrink-0">
                        AB
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight hover:text-brand-600 hover:underline cursor-pointer">
                          Abhi B.
                        </h3>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5">Product Designer @ Unimad</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <span>1h</span> • <Globe size={10} />
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-500 hover:bg-slate-100 p-1 rounded-full">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  <textarea
                    value={generatedContent}
                    onChange={e => setGeneratedContent(e.target.value)}
                    placeholder="Your content preview will appear here..."
                    className="w-full min-h-[160px] text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-slate-300 mb-2"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3 mt-2">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-brand-600 hover:underline">
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center ring-2 ring-white">
                          <ThumbsUp size={8} className="text-white fill-current" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white">
                          <span className="text-[6px] text-white">❤️</span>
                        </div>
                      </div>
                      <span>1,245</span>
                    </div>
                    <div className="hover:text-brand-600 hover:underline cursor-pointer">88 comments • 12 reposts</div>
                  </div>
                  <div className="flex items-center justify-between pt-1 px-2">
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <ThumbsUp size={18} /> <span className="hidden sm:inline">Like</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <MessageSquare size={18} /> <span className="hidden sm:inline">Comment</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <Repeat size={18} /> <span className="hidden sm:inline">Repost</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <Send size={18} /> <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Plain Text / Document Preview for Others */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg w-full max-w-xl mx-auto flex flex-col min-h-[600px]">
                  {/* Document Header (PDF Button) */}
                  {selectedTopic === "cover-letter" && (
                    <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-end">
                      <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        <Download size={14} /> Download as PDF
                      </button>
                    </div>
                  )}

                  <div className="flex-1 p-12">
                    <textarea
                      value={generatedContent}
                      onChange={e => setGeneratedContent(e.target.value)}
                      placeholder={`Your ${selectedTopic.replace("-", " ")} draft will appear here...`}
                      className="w-full h-full text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-serif"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScheduler && (
        <PostSchedulerModal
          content={generatedContent}
          onClose={() => setShowScheduler(false)}
          onPost={handlePost}
          initialData={selectedPostData ? { isScheduled: selectedPostData.isScheduled ?? false, date: new Date() } : undefined}
        />
      )}

      {showAllPostsModal && (
        <AllPostsModal
          initialTab={allPostsInitialTab}
          scheduledPosts={scheduledPosts}
          historyPosts={postHistory}
          onClose={() => setShowAllPostsModal(false)}
          onPostClick={(post, type) => {
            setShowAllPostsModal(false);
            handlePostClick(post, type);
          }}
          onDeletePost={(id, type) => console.log("Delete stub")}
        />
      )}
    </div>
  );
};

export default StudioMain;
