"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

type SuggestionPillsProps = {
  suggestions: string[];
  loading?: boolean;
  active?: boolean;
  value: string;
  onChange: (value: string) => void;
  mode?: "comma" | "bullet";
};

export default function SuggestionPills({
  suggestions,
  loading = false,
  active = true,
  value,
  onChange,
  mode = "comma",
}: SuggestionPillsProps) {
  const selected = useMemo(() => {
    if (!value.trim()) return [];
    if (mode === "bullet") {
      return value
        .split(/\r?\n/)
        .map(line => line.replace(/^-\s*/, "").trim())
        .filter(Boolean);
    }
    return value
      .split(", ")
      .map(s => s.trim())
      .filter(Boolean);
  }, [value, mode]);

  const toggle = (item: string) => {
    const next = selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item];
    if (mode === "bullet") {
      onChange(next.map(s => `- ${s}`).join("\n"));
    } else {
      onChange(next.join(", "));
    }
  };

  if (!active) return null;

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 min-w-[7rem] animate-pulse rounded-xl bg-[#F0F0F0]" />
        ))}
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {suggestions.map(item => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`relative max-w-[16rem] shrink-0 rounded-xl px-3 py-2 text-left text-xs leading-snug transition-colors ${
              isSelected ? "bg-[#E8F0FE] text-[#346DE0]" : "bg-[#F0F0F0] text-[#4A5568] hover:bg-[#E8E8E8]"
            }`}
          >
            {item}
            {isSelected ? <Check size={12} className="absolute right-1.5 top-1.5 text-[#346DE0]" /> : null}
          </button>
        );
      })}
    </div>
  );
}
