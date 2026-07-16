"use client";

import React from "react";
import { isPersistedVpdId } from "@/features/vpd/utils/isPersistedVpdId";
import { isVpdTemplateId } from "@/features/vpd/utils/isVpdTemplateId";
// import { downloadVpdPdf } from "@/lib/vpd/vpdExport";
// import { Download } from "lucide-react";
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
  // PDF export temporarily disabled for all VPDs (user assets + templates).
  // const handleDownload = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   downloadVpdPdf(project);
  // };

  const showPublish = Boolean(onSlugChange) && isPersistedVpdId(project.id) && !isVpdTemplateId(project.id);

  if (!showPublish || !onSlugChange) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <VpdPublishMenu project={project} slug={slug} onSlugChange={onSlugChange} onBeforePublish={onBeforePublish} />
      {/* <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Download size={14} />
        Download PDF
      </button> */}
    </div>
  );
};

export default VpdExportActions;
