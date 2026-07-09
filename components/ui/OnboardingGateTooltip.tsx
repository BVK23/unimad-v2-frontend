"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FINISH_ONBOARDING_CTA, ONBOARDING_GATE_MESSAGES, type OnboardingGateMessageKey } from "@/constants/onboarding-tooltips";
import { onboardingHref, type OnboardingPromptKind } from "@/features/onboarding/featureGates";
import { ONBOARDING_GATE_POPOVER_Z_INDEX } from "@/lib/ui/modal-overlay";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";

type OnboardingGateTooltipProps = {
  children: React.ReactNode;
  /** When false, renders children only (no gate). */
  enabled: boolean;
  /** Context-specific copy key. */
  messageKey?: OnboardingGateMessageKey;
  /** Override message (takes precedence over messageKey). */
  message?: string;
  ctaLabel?: string;
  kind?: OnboardingPromptKind;
  className?: string;
  side?: "top" | "bottom";
  align?: "left" | "right" | "center";
};

const POPOVER_WIDTH = 288;
const POPOVER_EST_HEIGHT = 140;
const VIEWPORT_PAD = 8;

type Placement = { top: number; left: number; width: number };

/**
 * Light gate popover (hover/tap) with info text + right-aligned CTA.
 * Rendered in a portal above modals; clamped fully inside the viewport.
 */
export function OnboardingGateTooltip({
  children,
  enabled,
  messageKey,
  message,
  ctaLabel = FINISH_ONBOARDING_CTA,
  kind = "profile_setup",
  className,
  side = "top",
  align = "center",
}: OnboardingGateTooltipProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = message ?? (messageKey ? ONBOARDING_GATE_MESSAGES[messageKey] : ONBOARDING_GATE_MESSAGES.cover_letter);

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popH = popoverRef.current?.offsetHeight || POPOVER_EST_HEIGHT;
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_PAD * 2);

    let left = rect.left + rect.width / 2 - width / 2;
    if (align === "left") left = rect.left;
    if (align === "right") left = rect.right - width;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - width - VIEWPORT_PAD));

    const belowTop = rect.bottom + VIEWPORT_PAD;
    const aboveTop = rect.top - VIEWPORT_PAD - popH;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
    const spaceAbove = rect.top - VIEWPORT_PAD;

    let top: number;
    if (side === "bottom") {
      if (spaceBelow >= popH || spaceBelow >= spaceAbove) {
        top = belowTop;
      } else {
        top = aboveTop;
      }
    } else if (spaceAbove >= popH || spaceAbove >= spaceBelow) {
      top = aboveTop;
    } else {
      top = belowTop;
    }

    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - VIEWPORT_PAD - popH));
    setPlacement({ top, left, width });
  }, [align, side]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  useLayoutEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measure trigger before paint so portal popover is positioned
    updateCoords();
  }, [open, copy, ctaLabel, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateCoords]);

  if (!enabled) {
    return <>{children}</>;
  }

  const show = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updateCoords();
    setOpen(true);
  };

  const hide = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  const popover =
    open && placement && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            className="fixed max-w-[calc(100vw-16px)]"
            style={{
              top: placement.top,
              left: placement.left,
              width: placement.width,
              zIndex: ONBOARDING_GATE_POPOVER_Z_INDEX,
            }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="flex gap-2">
                <Info size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                <p className="text-sm leading-snug text-slate-700 dark:text-slate-200">{copy}</p>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    router.push(onboardingHref(kind));
                  }}
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.99]"
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={className ?? "inline-flex"}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(value => !value);
        }}
      >
        {children}
      </div>
      {popover}
    </>
  );
}
