import React from "react";
import { PortfolioItem } from "../../types";
import VpdCardThumbnail from "./VpdCardThumbnail";

export type VpdLibraryItem = {
  id: string | number;
  title: string;
  date: string;
  isTemplate?: boolean;
  project: PortfolioItem;
};

interface VpdLibraryCardProps {
  vpd: VpdLibraryItem;
  onClick: () => void;
}

const VpdLibraryCard: React.FC<VpdLibraryCardProps> = ({ vpd, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-brand-500/50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500/40"
  >
    <div className="relative h-full w-full">
      <VpdCardThumbnail project={vpd.project} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent px-2 pb-2 pt-6">
        <h4 className="line-clamp-2 text-[11px] font-semibold leading-tight text-white">{vpd.title}</h4>
        <p className="mt-0.5 text-[10px] text-white/70">{vpd.date}</p>
      </div>
    </div>
  </button>
);

export default VpdLibraryCard;
