"use client";

import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type HoverTooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  /** When false, renders children without a tooltip. */
  enabled?: boolean;
};

/**
 * Instant hover/focus tooltip (Radix). Wraps disabled controls in a span so
 * pointer events still reach the trigger.
 */
export function HoverTooltip({
  content,
  children,
  side = "top",
  align = "center",
  className,
  contentClassName,
  enabled = true,
}: HoverTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount + touch detection for SSR-safe tooltip
    setMounted(true);
    const checkTouch = () => {
      setIsTouch(window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  if (!enabled || !content) {
    return <>{children}</>;
  }

  if (!mounted) {
    return <span className={className}>{children}</span>;
  }

  const handleTap = () => {
    if (isTouch) {
      setOpen(prev => !prev);
    }
  };

  return (
    <Tooltip open={isTouch ? open : undefined} onOpenChange={isTouch ? setOpen : undefined}>
      <TooltipTrigger asChild>
        <span
          className={className ?? "inline-flex"}
          onClick={isTouch ? handleTap : undefined}
          onKeyDown={
            isTouch
              ? e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(prev => !prev);
                  }
                }
              : undefined
          }
          role={isTouch ? "button" : undefined}
          tabIndex={isTouch ? 0 : undefined}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className={contentClassName}>
        {typeof content === "string" ? <p>{content}</p> : content}
      </TooltipContent>
    </Tooltip>
  );
}
