import React from "react";
import StudioListDeleteButton from "./StudioListDeleteButton";

export type LinkedInListItem = {
  id: string | number;
  content: string;
  date: string;
};

interface LinkedInPostListCardProps {
  post: LinkedInListItem;
  onClick: () => void;
  onDelete?: (id: string | number) => void;
  isSelected?: boolean;
}

const LinkedInPostListCard: React.FC<LinkedInPostListCardProps> = ({ post, onClick, onDelete, isSelected = false }) => (
  <div
    className={`group/card relative w-full rounded-xl border transition-all ${
      isSelected
        ? "border-brand-500/50 bg-brand-50 shadow-sm ring-1 ring-brand-500/25 dark:border-brand-500/40 dark:bg-brand-950/40 dark:ring-brand-500/30"
        : "border-slate-200/80 bg-slate-100 hover:border-slate-300 hover:bg-slate-200/90 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    }`}
  >
    <button type="button" onClick={onClick} className="w-full p-3 pr-9 text-left">
      <div
        className={`mb-2 truncate text-[11px] font-medium ${
          isSelected ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {post.date}
      </div>
      <p
        className={`line-clamp-3 text-[13px] leading-snug ${
          isSelected ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {post.content}
      </p>
    </button>
    {onDelete && (
      <StudioListDeleteButton
        ariaLabel="Delete post"
        onClick={e => {
          e.stopPropagation();
          onDelete(post.id);
        }}
      />
    )}
  </div>
);

export default LinkedInPostListCard;
