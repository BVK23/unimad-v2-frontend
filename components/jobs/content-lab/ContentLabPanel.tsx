import React from "react";
import { ArrowRight, FileText, Mail, UserCheck, Sparkles } from "lucide-react";
import { GeneratorContext } from "../../../types/jobs";

const CONTENT_LAB_TOOLS: {
  name: string;
  desc: string;
  type: GeneratorContext["type"];
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  hoverBorderClass: string;
}[] = [
  {
    name: "AI Cover Letter",
    desc: "Tailored letters",
    type: "cover-letter",
    icon: FileText,
    iconBgClass: "bg-blue-100 dark:bg-blue-900/40",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    hoverBorderClass: "hover:border-blue-500 hover:shadow-blue-500/10 dark:hover:border-blue-500",
  },
  {
    name: "Outreach Email",
    desc: "Outreach templates",
    type: "cold-email",
    icon: Mail,
    iconBgClass: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    hoverBorderClass: "hover:border-emerald-500 hover:shadow-emerald-500/10 dark:hover:border-emerald-500",
  },
  {
    name: "Referral Pitch",
    desc: "Get referred",
    type: "referral",
    icon: UserCheck,
    iconBgClass: "bg-amber-100 dark:bg-amber-900/40",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    hoverBorderClass: "hover:border-amber-500 hover:shadow-amber-500/10 dark:hover:border-amber-500",
  },
  {
    name: "Elevator Pitch",
    desc: "Your strengths",
    type: "vpd",
    icon: Sparkles,
    iconBgClass: "bg-purple-100 dark:bg-purple-900/40",
    iconColorClass: "text-purple-600 dark:text-purple-400",
    hoverBorderClass: "hover:border-purple-500 hover:shadow-purple-500/10 dark:hover:border-purple-500",
  },
];

interface ContentLabPanelProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
}

export default function ContentLabPanel({ onNavigateToStudio }: ContentLabPanelProps) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-950">
      <div className="relative z-10 mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg dark:text-white">
          Supercharge Your Outreach with AI
        </h2>
        <button
          type="button"
          onClick={() => onNavigateToStudio({ type: "cover-letter" })}
          className="group flex w-fit items-center gap-1.5 text-sm font-medium text-brand-600 transition-all hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          <span className="relative overflow-hidden pb-0.5">
            Open Content Lab
            <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {CONTENT_LAB_TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.name}
              type="button"
              onClick={() => onNavigateToStudio({ type: tool.type })}
              className={`group relative flex cursor-pointer flex-col items-center justify-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 pb-6 pt-6 text-center shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800 ${tool.hoverBorderClass}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${tool.iconBgClass} ${tool.iconColorClass}`}
              >
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h4 className="text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-white">{tool.name}</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
