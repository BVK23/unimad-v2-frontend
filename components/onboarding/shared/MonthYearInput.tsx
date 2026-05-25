"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "lucide-react";

type MonthYearInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showPresentOption?: boolean;
  presentLabel?: string;
  className?: string;
  invalid?: boolean;
  align?: "left" | "right";
};

const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const PRESENT_VALUE = "Present";

const parseValue = (value: string): { year: number; month: number } | null => {
  if (!value || value === PRESENT_VALUE) return null;
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [y, m] = value.split("-");
  return { year: Number(y), month: Math.max(0, Math.min(11, Number(m) - 1)) };
};

export default function MonthYearInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  showPresentOption = false,
  presentLabel = "Present",
  className = "",
  invalid = false,
  align = "left",
}: MonthYearInputProps) {
  const isPresent = value === PRESENT_VALUE;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const years = useMemo(() => {
    return Array.from({ length: 66 }, (_, i) => currentYear + 5 - i);
  }, [currentYear]);

  const parsed = useMemo(() => parseValue(value), [value]);

  // Internal draft state for the open popover, so partial selections don't
  // get wiped by the parent until the user confirms with "Apply".
  const [draftYear, setDraftYear] = useState<number>(parsed?.year ?? currentYear);
  const [draftMonth, setDraftMonth] = useState<number>(parsed?.month ?? currentMonth);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const openPopover = () => {
    if (disabled) return;
    setDraftYear(parsed?.year ?? currentYear);
    setDraftMonth(parsed?.month ?? currentMonth);
    setIsOpen(true);
  };

  const handleApply = () => {
    const next = `${draftYear}-${String(draftMonth + 1).padStart(2, "0")}`;
    onChange(next);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handlePresent = () => {
    onChange(PRESENT_VALUE);
    setIsOpen(false);
  };

  const triggerLabel = isPresent ? presentLabel : value ? formatMonthYear(value) : placeholder;

  const triggerBorder = invalid ? "border-rose-300" : "border-[rgba(12,15,26,0.07)]";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={placeholder}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={openPopover}
        className={`w-full flex items-center justify-between gap-2 rounded-[9px] border bg-white px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:border-[#346DE0] ${triggerBorder} ${
          disabled ? "opacity-50 cursor-not-allowed bg-[#F8F9FB]" : "hover:border-[#346DE0]"
        } ${value ? "text-[#0C0F1A]" : "text-[#9AA3B2]"}`}
      >
        <span className="truncate text-left">{triggerLabel}</span>
        <Calendar size={14} className="text-[#4A5568] flex-shrink-0" />
      </button>

      {isOpen && !disabled ? (
        <div
          role="dialog"
          className={`absolute z-50 mt-1 top-full w-64 bg-white border border-[rgba(12,15,26,0.07)] rounded-[12px] shadow-xl p-3 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#0C0F1A]">Select date</span>
            {showPresentOption ? (
              <button type="button" onClick={handlePresent} className="text-xs font-medium text-[#346DE0] hover:underline">
                {presentLabel}
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 mb-3">
            <select
              aria-label="Month"
              value={draftMonth}
              onChange={e => setDraftMonth(Number(e.target.value))}
              className="w-1/2 rounded-[9px] border border-[rgba(12,15,26,0.07)] bg-[#F8F9FB] px-2 py-2 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0]"
            >
              {MONTHS.map((m, idx) => (
                <option key={m.value} value={idx}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={draftYear}
              onChange={e => setDraftYear(Number(e.target.value))}
              className="w-1/2 rounded-[9px] border border-[rgba(12,15,26,0.07)] bg-[#F8F9FB] px-2 py-2 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0]"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {value ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-2 rounded-[9px] border border-[rgba(12,15,26,0.07)] text-xs font-medium text-[#4A5568] hover:border-[#346DE0] hover:text-[#346DE0]"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2 rounded-[9px] bg-[#346DE0] hover:bg-[#2A5BC4] text-white text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function formatMonthYear(value: string): string {
  if (!value) return "";
  if (value === PRESENT_VALUE) return PRESENT_VALUE;
  const parts = value.split("-");
  if (parts.length !== 2) return value;
  const [y, m] = parts;
  const monthIdx = Math.max(0, Math.min(11, Number(m) - 1));
  const monthLabel = MONTHS[monthIdx]?.label ?? m;
  const yearShort = y.length === 4 ? y.slice(2) : y;
  return `${monthLabel} '${yearShort}`;
}
