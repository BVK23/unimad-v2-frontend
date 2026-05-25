import React from "react";
import { Trash2 } from "lucide-react";

interface StudioListDeleteButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  className?: string;
}

const StudioListDeleteButton: React.FC<StudioListDeleteButtonProps> = ({ onClick, ariaLabel = "Delete", className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`absolute right-2 top-2 text-slate-400 fill-transparent transition-colors hover:text-red-500 hover:fill-red-500 sm:opacity-0 sm:group-hover/card:opacity-100 ${className}`}
    aria-label={ariaLabel}
    title="Delete"
  >
    <Trash2 size={14} strokeWidth={2} />
  </button>
);

export default StudioListDeleteButton;
