"use client";

import React from "react";
import { downloadVpdPdf } from "@/lib/vpd/vpdExport";
import { Download } from "lucide-react";
import type { PortfolioItem } from "../../types";
import VpdPublishMenu from "./VpdPublishMenu";

interface VpdExportActionsProps {
  project: PortfolioItem;
  slug?: string | null;
  onSlugChange?: (slug: string) => void;
  onBeforePublish?: () => Promise<void>;
  className?: string;
}

const VpdExportActions: React.FC<VpdExportActionsProps> = ({ project, slug = null, onSlugChange, onBeforePublish, className = "" }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadVpdPdf(project);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onSlugChange ? <VpdPublishMenu project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} /> : null}
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Download size={14} />
        Download PDF
      </button>
    </div>
  );
};

export default VpdExportActions;
