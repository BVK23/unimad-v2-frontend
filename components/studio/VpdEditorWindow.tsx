import React from "react";
import { X } from "lucide-react";
import { PortfolioItem } from "../../types";
import ProjectDetailView from "../ProjectDetailView";
import VpdExportActions from "./VpdExportActions";

interface VpdEditorWindowProps {
  project: PortfolioItem;
  onClose: () => void;
  onUpdateProject: (updated: PortfolioItem) => void;
}

const VpdEditorWindow: React.FC<VpdEditorWindowProps> = ({ project, onClose, onUpdateProject }) => {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 dark:bg-slate-950 animate-in fade-in duration-200">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Value Prop Doc</p>
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{project.title || "Untitled VPD"}</h2>
        </div>
        <VpdExportActions project={project} className="hidden shrink-0 sm:flex" />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close editor"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex shrink-0 border-b border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-950 sm:hidden">
        <VpdExportActions project={project} />
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4 py-6 md:px-8">
        <div className="h-full w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <ProjectDetailView
            project={project}
            onBack={onClose}
            onUpdateProject={onUpdateProject}
            allowedBlockTypes={["text", "media", "link-box"]}
            gridColumns={12}
            maxWidthClassName="max-w-5xl"
            hideToolbar
          />
        </div>
      </div>
    </div>
  );
};

export default VpdEditorWindow;
