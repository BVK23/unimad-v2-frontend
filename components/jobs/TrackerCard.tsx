import React from "react";
import type { Application, ApplicationStatus } from "@/features/application-tracker/types";
import { MoreHorizontal } from "lucide-react";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-slate-500",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offered: "bg-green-500",
  rejected: "bg-red-500",
};

interface TrackerCardProps {
  application: Application;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TrackerCard: React.FC<TrackerCardProps> = ({ application, onView }) => {
  const statusColor = STATUS_COLORS[application.status] ?? "bg-slate-500";
  const label = STATUS_LABELS[application.status] ?? application.status;

  return (
    <div
      onClick={onView}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] py-2.5 px-3 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 dark:text-white text-sm truncate">{application.role}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{application.company}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium text-white ${statusColor}`}>{label}</span>
        <MoreHorizontal size={14} className="text-slate-400" />
      </div>
    </div>
  );
};

export default TrackerCard;
