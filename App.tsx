import React, { useState } from "react";
import {
  LayoutGrid,
  FileText,
  Briefcase,
  Users,
  MonitorPlay,
  Bell,
  Search,
  Menu,
  Linkedin,
  Lock,
  GraduationCap,
  Mic2,
  ListTodo,
  PenTool,
} from "lucide-react";
import ChatSidebar from "./components/ChatSidebar";
import DebugConsole from "./components/DebugConsole";
import LinkedInDashboard from "./components/LinkedInDashboard";
import OnboardingModal from "./components/OnboardingModal";
import Portfolio from "./components/Portfolio";
import ProfileMenu from "./components/ProfileMenu";
import ResumeDashboard from "./components/ResumeDashboard";
import ResumeEditor from "./components/ResumeEditor";
import { AdkChatProvider } from "./components/chat/AdkChatProvider";
import type { UnibotIncomingRequest } from "./components/chat/unibot-incoming-request";
import CommunityMain from "./components/community/CommunityMain";
import JobsMain from "./components/jobs/JobsMain";
import StudioMainV2 from "./components/studio/StudioMainV2";
import { ResumeData } from "./types";
import { GeneratorContext } from "./types/jobs";

// Initial Empty Resume Template
const NEW_RESUME_TEMPLATE: ResumeData = {
  id: "",
  title: "Untitled Resume",
  lastModified: new Date(),
  templateId: "modern",
  profile: {
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    summary: "",
    title: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  customSections: [],
  sectionOrder: [
    { id: "profile" },
    { id: "experience" },
    { id: "education" },
    { id: "skills" },
    { id: "projects" },
    { id: "certifications" },
  ],
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");

  // Resume State
  const [resumeView, setResumeView] = useState<"list" | "editor">("list");
  const [currentResume, setCurrentResume] = useState<ResumeData | null>(null);

  // Chat State
  const [pendingAIRequest, setPendingAIRequest] = useState<UnibotIncomingRequest | null>(null);

  // Jobs & Studio State
  const [studioContext, setStudioContext] = useState<GeneratorContext | null>(null);

  const handleNavigateToStudio = (context: GeneratorContext) => {
    setStudioContext(context);
    setActiveTab("studio");
  };

  const handleEditResume = (resume: ResumeData) => {
    setCurrentResume(resume);
    setResumeView("editor");
  };

  // Global Modal State (Lifted for Console Access)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync Dark Mode with DOM
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Determine available popups based on context
  const getAvailablePopups = () => {
    const commonActions = [{ id: "theme", label: `Toggle ${isDarkMode ? "Light" : "Dark"} Mode`, onClick: toggleDarkMode }];

    if (activeTab === "resume" && resumeView === "editor") {
      return [
        ...commonActions,
        { id: "templates", label: "Template Gallery", onClick: () => setShowTemplateModal(true) },
        { id: "export", label: "Export / Share Modal", onClick: () => setShowExportModal(true) },
        { id: "onboarding", label: "Trigger Onboarding", onClick: () => setShowOnboardingModal(true) },
      ];
    }
    if (activeTab === "profile") {
      return [...commonActions, { id: "edit-profile", label: "Edit Profile Modal", onClick: () => alert("Toggle Profile Modal") }];
    }
    return commonActions;
  };

  const handleCreateResume = (type: "scratch" | "jd" | "upload") => {
    // ... (existing logic)
    const newResume = {
      ...NEW_RESUME_TEMPLATE,
      id: Date.now().toString(),
      title: type === "jd" ? "Targeted Resume" : "New Resume",
    };

    setCurrentResume(newResume);
    setResumeView("editor");
    setShowOnboardingModal(true);
  };

  // Restore handlers
  const handleSaveResume = (data: ResumeData) => {
    setCurrentResume(data);
  };

  // Legacy resume editor still passes a plain string; the newer
  // UnibotIncomingRequest payload is used by LinkedInDashboard via an
  // adapter below.
  const handleImproveWithAI = (text: string) => {
    setPendingAIRequest({ type: "improve", text });
  };
  const handleImproveStructured = (detail: { type: "improve"; text: string; improveType?: string; topicTitle?: string }) => {
    setPendingAIRequest(detail);
  };

  // ... (existing handleSaveResume, handleImproveWithAI)

  return (
    <div
      className={`flex h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-slate-100 text-[13px] transition-colors duration-300`}
    >
      {/* Sidebar (AI Chatbot) */}
      <AdkChatProvider userId="">
        <ChatSidebar incomingRequest={pendingAIRequest} onRequestHandled={() => setPendingAIRequest(null)} />
      </AdkChatProvider>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 min-h-[4rem] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 sticky top-0 z-30 flex-none font-sans transition-colors">
          <div className="flex h-full w-full items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 flex-1 items-center">
              {/* Navigation Menu */}
              <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "profile" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "resume" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  Resume
                </button>
                <button
                  onClick={() => setActiveTab("linkedin")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "linkedin" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "jobs" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  Jobs
                </button>
                <button
                  onClick={() => setActiveTab("studio")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "studio" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  Studio
                </button>
                <button
                  onClick={() => setActiveTab("community")}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${activeTab === "community" ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"}`}
                >
                  Community
                </button>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <button className="hidden sm:flex bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full text-xs font-medium shadow-sm transition-transform active:scale-95 items-center gap-2">
                {/* <Sparkles size={14} fill="currentColor" /> */}
                Hire a Career Coach
              </button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>

              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <Bell size={18} />
              </button>
              <ProfileMenu isDarkMode={isDarkMode} toggleTheme={toggleDarkMode} />
            </div>
          </div>
        </header>

        {/* View Content */}
        {activeTab === "profile" && <Portfolio portfolioId="demo" />}

        {activeTab === "resume" &&
          (resumeView === "list" ? (
            <ResumeDashboard onEditResume={handleEditResume} onCreateResume={handleCreateResume} />
          ) : (
            currentResume && (
              <ResumeEditor
                resumeId={currentResume.id}
                initialData={currentResume}
                onBack={() => setResumeView("list")}
                onSave={handleSaveResume}
                onImprove={handleImproveWithAI}
                showTemplateModal={showTemplateModal}
                setShowTemplateModal={setShowTemplateModal}
                showExportModal={showExportModal}
                setShowExportModal={setShowExportModal}
              />
            )
          ))}

        {activeTab === "linkedin" && <LinkedInDashboard onImprove={handleImproveStructured} />}

        {activeTab === "jobs" && (
          <JobsMain
            onNavigateToStudio={handleNavigateToStudio}
            activeTab="discovery"
            onTabChange={() => {}}
            interviewUrl={{ interviewId: null, view: null, round: null }}
            onInterviewUrlChange={() => {}}
          />
        )}
        {activeTab === "studio" && <StudioMainV2 initialContext={studioContext} />}

        {activeTab === "community" && <CommunityMain />}

        {activeTab !== "profile" &&
          activeTab !== "resume" &&
          activeTab !== "linkedin" &&
          activeTab !== "jobs" &&
          activeTab !== "studio" &&
          activeTab !== "community" && (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Users size={40} className="text-slate-300" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 capitalize mb-2">{activeTab} Section</h2>
              <p className="text-slate-500 max-w-md">
                This section is currently under development. Unimad&apos;s portfolio and resume builders are ready to use.
              </p>
            </div>
          )}
      </div>

      {/* Global Debug Console */}
      <DebugConsole context={activeTab} popups={getAvailablePopups()} onAddPopup={() => alert(`Add new popup for ${activeTab}`)} />

      {/* Global Onboarding Modal */}
      {showOnboardingModal && <OnboardingModal onComplete={() => setShowOnboardingModal(false)} />}
    </div>
  );
};

export default App;
