"use client";

import React, { useMemo } from "react";

type MonthYearInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showPresentOption?: boolean;
  presentLabel?: string;
  className?: string;
  invalid?: boolean;
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

export default function MonthYearInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  showPresentOption = false,
  presentLabel = "Present",
  className = "",
  invalid = false,
}: MonthYearInputProps) {
  const isPresent = value === PRESENT_VALUE;

  const { year, month } = useMemo(() => {
    if (!value || isPresent) return { year: "", month: "" };
    const parts = value.split("-");
    if (parts.length !== 2) return { year: "", month: "" };
    return { year: parts[0], month: parts[1] };
  }, [value, isPresent]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const list: string[] = [];
    for (let y = current + 5; y >= current - 60; y--) list.push(String(y));
    return list;
  }, []);

  const updateValue = (nextMonth: string, nextYear: string) => {
    if (!nextMonth || !nextYear) {
      onChange("");
      return;
    }
    onChange(`${nextYear}-${nextMonth}`);
  };

  const baseSelect =
    "w-full rounded-[9px] border bg-white px-3 py-2.5 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0]";
  const borderClass = invalid ? "border-rose-300" : "border-[rgba(12,15,26,0.07)]";

  if (showPresentOption && isPresent) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="flex-1 rounded-[9px] border border-[rgba(12,15,26,0.07)] bg-[#F8F9FB] px-3 py-2.5 text-sm font-medium text-[#346DE0]">
          {presentLabel}
        </span>
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={disabled}
          className="rounded-[9px] border border-[rgba(12,15,26,0.07)] px-3 py-2 text-xs font-medium text-[#4A5568] hover:border-[#346DE0]"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        aria-label={`${placeholder} - month`}
        disabled={disabled}
        value={month}
        onChange={e => updateValue(e.target.value, year)}
        className={`${baseSelect} ${borderClass} flex-1 min-w-[7rem]`}
      >
        <option value="">Month</option>
        {MONTHS.map(m => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        aria-label={`${placeholder} - year`}
        disabled={disabled}
        value={year}
        onChange={e => updateValue(month, e.target.value)}
        className={`${baseSelect} ${borderClass} flex-1 min-w-[6rem]`}
      >
        <option value="">Year</option>
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {showPresentOption ? (
        <button
          type="button"
          onClick={() => onChange(PRESENT_VALUE)}
          disabled={disabled}
          className="rounded-[9px] border border-[rgba(12,15,26,0.07)] px-3 py-2 text-xs font-medium text-[#4A5568] whitespace-nowrap hover:border-[#346DE0] hover:text-[#346DE0]"
        >
          {presentLabel}
        </button>
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
