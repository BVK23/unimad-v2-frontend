import React, { useState } from "react";
import { Building2, MapPin, Clock, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Job, GeneratorContext } from "../../types/jobs";

interface JobCardProps {
  job: Job;
  isHero?: boolean;
  hideDescription?: boolean;
  hideButtons?: boolean;
  onPrepare: (job: Job) => void;
  onApply?: (job: Job) => void;
  onClick: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  isHero = false,
  hideDescription = false,
  hideButtons = false,
  onPrepare,
  onApply,
  onClick,
}) => {
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

  return (
    <div
      onClick={() => onClick(job)}
      className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-brand-200/60 dark:hover:border-brand-500/30 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer flex flex-col h-full relative`}
    >
      <div className={`flex gap-4 ${hideButtons ? "mb-0" : "mb-4"}`}>
        {/* Logo - Left */}
        <div className="relative w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 overflow-hidden shrink-0">
          {!showFallback ? (
            <Image
              src={job.logo as string}
              alt={job.company}
              fill
              sizes="48px"
              className="object-contain p-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{job.company?.charAt(0)?.toUpperCase() || "?"}</span>
            </div>
          )}
        </div>

        {/* Text - Right */}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900 dark:text-white leading-tight truncate text-base mb-1 group-hover:text-brand-600 transition-colors">
            {job.role}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1">{job.company}</span>
            <span>•</span>
            <span className="font-medium flex items-center gap-1">{job.location}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              title="This job is highly likely to sponsor a visa"
              className="px-1.5 py-0.5 bg-gradient-to-b from-amber-200 to-yellow-400 text-yellow-900 rounded-md text-[9px] font-semibold border border-yellow-300 shadow-[0_1px_2px_rgba(251,191,36,0.2)] cursor-help hover:brightness-105 transition-all"
            >
              Visa
            </span>
            {/* Only show timing if not sponsoring to save space, or if hero */}
            {/* The original condition (!job.isSponsoring || isHero) is simplified as space is less of an issue now */}
            <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[9px] font-medium border border-slate-100 dark:border-slate-700 flex items-center gap-1">
              <Clock size={9} /> {job.postedDate}
            </span>
          </div>
        </div>

        {/* Job match score — hidden until backend match scoring is wired
        <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center">
          ...
        </div>
        */}
      </div>

      {/* Buttons - Conditional Render */}
      {!hideButtons && (
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={e => {
              e.stopPropagation();
              onPrepare(job);
            }}
            className="flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all active:scale-95 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
          >
            <FileText size={12} className="text-brand-500" /> Prepare
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              if (onApply) onApply(job);
            }}
            className="flex-1 bg-slate-900 dark:bg-white hover:bg-slate-800 hover:opacity-90 text-white dark:text-black py-2 px-2 rounded-lg text-xs font-medium transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
          >
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
};

export default JobCard;
