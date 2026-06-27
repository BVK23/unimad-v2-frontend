"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  isScheduleDateSelectable,
  isScheduleTimeSelectable,
  parseScheduleDateKey,
  SCHEDULE_TIME_OPTIONS,
  scheduleTimeBoundsForDate,
  toScheduleDateKey,
  type LinkedInPublishAccess,
} from "@/features/linkedin/utils/linkedinPublishAccess";
import { ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";

type Props = {
  scheduleDate: string;
  scheduleTime: string;
  onScheduleDateChange: (dateKey: string) => void;
  onScheduleTimeChange: (time: string) => void;
  linkedInPublishAccess: LinkedInPublishAccess;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfWeekSunday(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  result.setHours(12, 0, 0, 0);
  return result;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startFmt = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endFmt = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const year =
    weekStart.getFullYear() === weekEnd.getFullYear()
      ? String(weekStart.getFullYear())
      : `${weekStart.getFullYear()}–${weekEnd.getFullYear()}`;
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startFmt} – ${weekEnd.getDate()}, ${year}`;
  }
  return `${startFmt} – ${endFmt}, ${year}`;
}

function formatTimeLabel(time: string): string {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number(hourPart);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minutePart} ${period}`;
}

function formatSelectedDateLabel(dateKey: string): string {
  const date = parseScheduleDateKey(dateKey);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function LinkedInScheduleDateTimePicker({
  scheduleDate,
  scheduleTime,
  onScheduleDateChange,
  onScheduleTimeChange,
  linkedInPublishAccess,
}: Props) {
  const [weekAnchor, setWeekAnchor] = useState(() => {
    if (scheduleDate) return parseScheduleDateKey(scheduleDate);
    return new Date();
  });
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => weekAnchor.getMonth());
  const [pickerYear, setPickerYear] = useState(() => weekAnchor.getFullYear());

  const monthYearRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scheduleDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync week anchor when date prop changes
      setWeekAnchor(parseScheduleDateKey(scheduleDate));
    }
  }, [scheduleDate]);

  useEffect(() => {
    if (!showMonthYearPicker) return;
    const onPointerDown = (e: MouseEvent) => {
      if (monthYearRef.current && !monthYearRef.current.contains(e.target as Node)) {
        setShowMonthYearPicker(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showMonthYearPicker]);

  useEffect(() => {
    if (!showTimeDropdown) return;
    const onPointerDown = (e: MouseEvent) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showTimeDropdown]);

  const weekStart = useMemo(() => startOfWeekSunday(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        return day;
      }),
    [weekStart]
  );

  const timeOptions = useMemo(() => {
    if (!scheduleDate) return [];
    const bounds = scheduleTimeBoundsForDate(scheduleDate, linkedInPublishAccess);
    return SCHEDULE_TIME_OPTIONS.filter(time => {
      if (bounds.min && time < bounds.min) return false;
      if (bounds.max && time > bounds.max) return false;
      return isScheduleTimeSelectable(scheduleDate, time, linkedInPublishAccess);
    });
  }, [scheduleDate, linkedInPublishAccess]);

  useEffect(() => {
    if (!scheduleDate || !scheduleTime) return;
    if (isScheduleTimeSelectable(scheduleDate, scheduleTime, linkedInPublishAccess)) return;
    onScheduleTimeChange(timeOptions[0] ?? "");
  }, [scheduleDate, scheduleTime, linkedInPublishAccess, timeOptions, onScheduleTimeChange]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const endYear = linkedInPublishAccess.sessionEndsAt ? new Date(linkedInPublishAccess.sessionEndsAt).getFullYear() : currentYear + 2;
    const years: number[] = [];
    for (let y = currentYear; y <= endYear; y += 1) {
      years.push(y);
    }
    return years.length > 0 ? years : [currentYear];
  }, [linkedInPublishAccess.sessionEndsAt]);

  const stepWeek = (delta: number) => {
    const next = new Date(weekAnchor);
    next.setDate(next.getDate() + delta * 7);
    setWeekAnchor(next);
  };

  const applyMonthYear = (month: number, year: number) => {
    const next = new Date(year, month, 1, 12, 0, 0, 0);
    for (let offset = 0; offset < 31; offset += 1) {
      const candidate = new Date(year, month, 1 + offset, 12, 0, 0, 0);
      if (candidate.getMonth() !== month) break;
      if (isScheduleDateSelectable(candidate, linkedInPublishAccess)) {
        setWeekAnchor(candidate);
        setShowMonthYearPicker(false);
        return;
      }
    }
    setWeekAnchor(next);
    setShowMonthYearPicker(false);
  };

  const handleDateSelect = (key: string) => {
    onScheduleDateChange(key);
    setShowTimeDropdown(true);
    const bounds = scheduleTimeBoundsForDate(key, linkedInPublishAccess);
    const options = SCHEDULE_TIME_OPTIONS.filter(time => {
      if (bounds.min && time < bounds.min) return false;
      if (bounds.max && time > bounds.max) return false;
      return isScheduleTimeSelectable(key, time, linkedInPublishAccess);
    });
    if (options[0]) {
      onScheduleTimeChange(options[0]);
    }
  };

  const weekLabel = formatWeekRange(weekStart);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Pick a date</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => stepWeek(-1)}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative" ref={monthYearRef}>
              <button
                type="button"
                onClick={() => {
                  setPickerMonth(weekAnchor.getMonth());
                  setPickerYear(weekAnchor.getFullYear());
                  setShowMonthYearPicker(open => !open);
                }}
                className="min-w-[10.5rem] rounded-lg px-2 py-1 text-center text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {weekLabel}
              </button>
              {showMonthYearPicker ? (
                <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">Jump to month</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={pickerMonth}
                      onChange={e => {
                        const month = Number(e.target.value);
                        setPickerMonth(month);
                        applyMonthYear(month, pickerYear);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                    >
                      {MONTH_LABELS.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={pickerYear}
                      onChange={e => {
                        const year = Number(e.target.value);
                        setPickerYear(year);
                        applyMonthYear(pickerMonth, year);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                    >
                      {yearOptions.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => stepWeek(1)}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {WEEKDAY_LABELS.map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const key = toScheduleDateKey(day);
            const selectable = isScheduleDateSelectable(day, linkedInPublishAccess);
            const isSelected = scheduleDate === key;
            const isToday = key === toScheduleDateKey(new Date());

            return (
              <button
                key={key}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && handleDateSelect(key)}
                className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-sm font-medium transition-all ${
                  !selectable
                    ? "cursor-not-allowed border-transparent text-slate-300 opacity-40 dark:text-slate-600"
                    : isSelected
                      ? "border-brand-500 bg-brand-600 text-white shadow-md shadow-brand-500/25"
                      : isToday
                        ? "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                        : "border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {scheduleDate ? (
        <div className="relative" ref={timeDropdownRef}>
          <button
            type="button"
            onClick={() => setShowTimeDropdown(open => !open)}
            className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition-all dark:bg-slate-900/60 ${
              showTimeDropdown ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <Clock size={15} className="shrink-0 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{formatSelectedDateLabel(scheduleDate)}</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {scheduleTime ? formatTimeLabel(scheduleTime) : "Pick a time"}
            </span>
            <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${showTimeDropdown ? "rotate-180" : ""}`} />
          </button>

          {showTimeDropdown ? (
            <div className="scrollbar-on-hover absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {timeOptions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-amber-700 dark:text-amber-300">No available times on this date.</p>
              ) : (
                timeOptions.map(time => {
                  const selected = scheduleTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        onScheduleTimeChange(time);
                        setShowTimeDropdown(false);
                      }}
                      className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {formatTimeLabel(time)}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
