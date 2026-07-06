"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

const DELETE_DURATION_MS = 5000;

type CollapsibleEntryProps = {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: React.ReactNode;
};

export function CollapsibleEntry({ title, subtitle, open, onToggle, onRemove, children }: CollapsibleEntryProps) {
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(100);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const cancelDelete = useCallback(() => {
    setPendingDelete(false);
    setDeleteProgress(100);
    startTimeRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startDelete = useCallback(() => {
    if (pendingDelete) return;
    setPendingDelete(true);
    setDeleteProgress(100);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const start = startTimeRef.current ?? now;
      const elapsed = now - start;
      const remaining = Math.max(0, 100 - (elapsed / DELETE_DURATION_MS) * 100);
      setDeleteProgress(remaining);

      if (elapsed >= DELETE_DURATION_MS) {
        rafRef.current = null;
        setPendingDelete(false);
        onRemove();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [onRemove, pendingDelete]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <div
      className={`relative overflow-hidden rounded-[12px] border transition-colors ${
        pendingDelete ? "border-red-300/60" : open ? "border-[#346DE0]/35 bg-[#FAFCFF]" : "border-[rgba(12,15,26,0.08)] bg-[#F8F9FB]"
      }`}
    >
      <div
        className={pendingDelete ? "bg-red-50/30" : undefined}
        style={pendingDelete ? { clipPath: `inset(0 ${100 - deleteProgress}% 0 0)` } : undefined}
      >
        <div className="flex items-start gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={onToggle}
            disabled={pendingDelete}
            className="flex min-w-0 flex-1 items-start gap-2 text-left disabled:opacity-60"
          >
            <ChevronDown size={16} className={`mt-0.5 shrink-0 text-[#4A5568] transition-transform ${open ? "rotate-180" : ""}`} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#0C0F1A]">{title}</p>
              {subtitle ? <p className="mt-0.5 line-clamp-2 text-[11px] text-[#4A5568]">{subtitle}</p> : null}
            </div>
          </button>
          {!pendingDelete ? (
            <button
              type="button"
              onClick={startDelete}
              className="shrink-0 rounded-md p-1 text-[#A9B4C2] hover:bg-white hover:text-red-500"
              aria-label="Remove entry"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {open && !pendingDelete ? <div className="border-t border-[rgba(12,15,26,0.06)] px-3 py-3">{children}</div> : null}
      </div>

      {pendingDelete ? (
        <div className="relative z-10 border-t border-red-200/80 bg-red-50/95">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <p className="text-xs font-medium text-red-700">This entry will be deleted</p>
            <button
              type="button"
              onClick={cancelDelete}
              className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#0C0F1A] shadow-sm ring-1 ring-[rgba(12,15,26,0.08)] hover:bg-[#F8F9FB]"
            >
              Cancel
            </button>
          </div>
          <div className="h-0.5 w-full bg-red-200">
            <div className="h-full bg-red-500" style={{ width: `${deleteProgress}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-[10px] border border-[rgba(12,15,26,0.12)] bg-white px-3 py-2 text-sm text-[#0C0F1A] placeholder:text-[#A9B4C2] focus:border-[#346DE0] focus:outline-none focus:ring-2 focus:ring-[#346DE0]/15";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#A9B4C2]">{label}</span>
      {children}
    </label>
  );
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = startDate?.trim() ? formatMonthYearLabel(startDate) : "Unknown";
  const end = endDate === "Present" ? "Present" : endDate?.trim() ? formatMonthYearLabel(endDate) : "Unknown";
  return `${start} – ${end}`;
}

function formatMonthYearLabel(value: string): string {
  if (!value || value === "Present") return value || "—";
  const [y, m] = value.split("-");
  if (!y || !m) return value;
  const d = new Date(Number(y), Number(m) - 1);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
