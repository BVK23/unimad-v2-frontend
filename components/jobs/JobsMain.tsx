import React, { useState } from "react";
import { Search, Map, Mic2 } from "lucide-react";
import { GeneratorContext } from "../../types/jobs";
import ApplicationTracker from "./ApplicationTracker";
import InterviewPrep from "./InterviewPrep";
import JobDiscovery from "./JobDiscovery";

interface JobsMainProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
}

const JobsMain: React.FC<JobsMainProps> = ({ onNavigateToStudio }) => {
  const [activeTab, setActiveTab] = useState<"discovery" | "tracker" | "interview">("discovery");

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-hidden flex flex-col font-sans">
      {/* Jobs Navigation Header */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Icon Removed as requested */}
            <div>
              <h1 className="text-2xl font-medium text-slate-900 dark:text-white leading-none">Jobs & Career</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Find, Apply, and Prepare for your dream role</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("discovery")}
              className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${activeTab === "discovery" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <Search size={14} /> Discovery
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${activeTab === "tracker" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <Map size={14} /> Tracker
            </button>
            <button
              onClick={() => setActiveTab("interview")}
              className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${activeTab === "interview" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <Mic2 size={14} /> Interview Prep
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "discovery" && <JobDiscovery onNavigateToStudio={onNavigateToStudio} />}
        {activeTab === "tracker" && <ApplicationTracker onNavigateToStudio={onNavigateToStudio} />}
        {activeTab === "interview" && <InterviewPrep />}
      </div>
    </div>
  );
};

export default JobsMain;
