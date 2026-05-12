import React from "react";
import { X } from "lucide-react";

type ChipProps = {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
};

export default function Chip({ label, selected, onClick, onRemove, className = "" }: ChipProps) {
  const baseClass =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors max-w-[220px] break-words text-center";
  const stateClass = selected
    ? "bg-[#346DE0] text-white shadow-[0_4px_12px_rgba(52,109,224,0.18)]"
    : "bg-white text-[#4A5568] border border-[rgba(12,15,26,0.07)] hover:border-[#346DE0] hover:text-[#346DE0]";

  return (
    <button type="button" onClick={onClick} className={`${baseClass} ${stateClass} ${className}`}>
      <span className="whitespace-normal text-left">{label}</span>
      {onRemove ? (
        <X
          size={12}
          className="cursor-pointer flex-shrink-0"
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
        />
      ) : null}
    </button>
  );
}

export function ChipSkeleton() {
  return <div className="h-[34px] min-w-[80px] rounded-full bg-[rgba(12,15,26,0.06)] animate-pulse" />;
}
