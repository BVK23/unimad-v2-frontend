"use client";

import React from "react";
import ProjectDetailView from "@/components/ProjectDetailView";
import type { PortfolioItem } from "@/types";

type PublishedVpdViewProps = {
  project: PortfolioItem;
};

/** Read-only public render of a published VPD (portfolio-grid schema v2). */
const PublishedVpdView: React.FC<PublishedVpdViewProps> = ({ project }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-5xl overflow-hidden bg-white shadow-sm dark:bg-slate-950">
        <ProjectDetailView
          project={project}
          onBack={() => {}}
          onUpdateProject={() => {}}
          allowedBlockTypes={["text", "media", "link-box", "page-card", "table"]}
          gridColumns={12}
          maxWidthClassName="max-w-5xl"
          hideToolbar
          isEditMode={false}
          isNestedDetailView={false}
        />
      </div>
      <p className="py-6 text-center text-xs text-slate-400">Built with Unimad</p>
    </div>
  );
};

export default PublishedVpdView;
