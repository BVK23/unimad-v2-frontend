import React, { useState } from "react";
import { X, Building2, MapPin, Clock, ExternalLink, FileText, CheckCircle2, DollarSign } from "lucide-react";
import Image from "next/image";
import { Job } from "../../types/jobs";
import PrepareApplicationModal from "./PrepareApplicationModal";

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
  onApply?: (job: Job) => void;
  onToggleSave?: (e: React.MouseEvent, jobId: string) => void;
  isSaved?: boolean;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose, onApply, onToggleSave, isSaved }) => {
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isValidUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const showFallback = !isValidUrl(job.logo) || logoError;

  if (showPrepareModal) {
    return <PrepareApplicationModal job={job} onClose={() => setShowPrepareModal(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-3 shadow-sm overflow-hidden">
              {!showFallback ? (
                <Image
                  src={job.logo as string}
                  alt={job.company}
                  fill
                  sizes="64px"
                  className="object-contain p-2"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{job.company?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">{job.role}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{job.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{job.postedDate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={e => onToggleSave(e, job.id)}
                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2
                                    ${
                                      isSaved
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    }
                                `}
              >
                {isSaved ? "Saved" : "Save Job"}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.matchScore >= 90 && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                {job.matchScore}% Match
              </span>
            )}
            {job.isSponsoring && (
              <span
                title="This job is highly likely to sponsor a visa"
                className="px-3 py-1 bg-gradient-to-b from-amber-200 to-yellow-400 text-yellow-900 text-xs font-semibold rounded-full border border-yellow-300 shadow-sm cursor-help hover:brightness-105 transition-all"
              >
                Visa Sponsorship
              </span>
            )}
            {job.salaryRange && (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full flex items-center gap-1">
                <DollarSign size={12} /> {job.salaryRange}
              </span>
            )}
          </div>

          <section>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">About the Role</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
              {/* Mock additional text since real description is short */}
              {`\n\nIn this role, you will be responsible for defining the user experience for our core products. You'll work closely with product managers and engineers to ship high-quality features that solve real user problems.`}
            </p>
          </section>

          <section>
            <h3 className="font-medium text-lg text-slate-900 dark:text-white mb-3">Requirements</h3>
            <ul className="space-y-2">
              {[
                "3+ years of experience in product design",
                "Proficiency in Figma and prototyping tools",
                "Experience with design systems",
                "Strong communication skills",
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a] flex items-center gap-4">
          <button
            onClick={() => setShowPrepareModal(true)}
            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <FileText size={18} className="text-blue-500" /> Prepare Application
          </button>
          <button
            onClick={() => onApply && onApply(job)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Apply Now <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
