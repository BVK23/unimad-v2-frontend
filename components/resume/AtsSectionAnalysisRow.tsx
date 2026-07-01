import type { AtsSectionAnalysisRow as AtsSectionRow } from "@/src/features/resume/api/ats-types";

type AtsSectionAnalysisRowProps = {
  section: AtsSectionRow;
};

const dotClass = (status: AtsSectionRow["status"]) => {
  if (status === "good") return "bg-green-500 shadow-sm shadow-green-200";
  if (status === "critical") return "bg-red-500 shadow-sm shadow-red-200";
  return "bg-yellow-500 shadow-sm shadow-yellow-200";
};

export const AtsSectionAnalysisRow = ({ section }: AtsSectionAnalysisRowProps) => {
  const scoreHint = section.scoreLabel ? `Section score: ${section.scoreLabel}` : "Section score unavailable";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <span className="font-medium text-slate-700 dark:text-slate-300 text-sm w-28 flex-shrink-0">{section.name}</span>
      <span className="flex-1 min-w-0 text-xs text-slate-500 dark:text-slate-400">{section.displayFeedback}</span>
      <span
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass(section.status)}`}
        title={scoreHint}
        aria-label={scoreHint}
        role="img"
      />
    </div>
  );
};
