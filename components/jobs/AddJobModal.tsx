import React, { useState } from "react";
import { X, Link, Building2, Globe, FileSearch } from "lucide-react";
import Image from "next/image";
import { Job } from "../../types/jobs";

interface AddJobModalProps {
  onClose: () => void;
  onAdd: (job: Job) => void;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ onClose, onAdd }) => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<"input" | "analyzing" | "confirm">("input");
  const [analyzedJob, setAnalyzedJob] = useState<Partial<Job> | null>(null);

  const handleAnalyze = () => {
    if (!url) return;
    setIsAnalyzing(true);
    setStage("analyzing");

    // Simulate AI Analysis
    setTimeout(() => {
      const mockJob: Job = {
        id: Date.now().toString(),
        role: "Senior Product Designer",
        company: "Airbnb",
        location: "Remote",
        salaryRange: "$160k - $210k",
        postedDate: "Just now",
        matchScore: 92,
        applicationStatus: "applied",
        logo: "",
        description:
          "We are looking for a Senior Product Designer to join our core experience team. You will be responsible for defining the future of travel experiences.",
        isSponsoring: true,
      };
      setAnalyzedJob(mockJob);
      setIsAnalyzing(false);
      setStage("confirm");
    }, 2000);
  };

  const handleConfirm = () => {
    if (analyzedJob) {
      onAdd(analyzedJob as Job);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Application</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        {stage === "input" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Job Posting URL</label>
              <div className="relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Paste the link from LinkedIn, Indeed, or a company career page.</p>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!url}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSearch size={18} /> Analyze & Add Job
            </button>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileSearch size={24} className="text-brand-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Analyzing Job Details...</h3>
              <p className="text-slate-500 text-sm">Extracting role, company, and requirements.</p>
            </div>
          </div>
        )}

        {stage === "confirm" && analyzedJob && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 relative overflow-hidden">
                {analyzedJob.logo ? (
                  <Image src={analyzedJob.logo} fill className="object-contain p-1" alt="Company logo" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{analyzedJob.company?.charAt(0)?.toUpperCase() || "?"}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{analyzedJob.role}</h3>
                <p className="text-sm text-slate-500">{analyzedJob.company}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                    {analyzedJob.location}
                  </span>
                  {analyzedJob.isSponsoring && (
                    <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                      Visa
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all"
              >
                Confirm & Add to Tracker
              </button>
              <button
                onClick={() => setStage("input")}
                className="w-full py-3 bg-transparent hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-colors"
              >
                Back to Input
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddJobModal;
