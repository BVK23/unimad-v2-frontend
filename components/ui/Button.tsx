"use client";

import React, { forwardRef } from "react";

const VARIANT_CLASSES = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500/40 dark:hover:bg-slate-800",
  secondaryIcon:
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
  ghost:
    "inline-flex items-center justify-center gap-2 font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
  destructive:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "w-full px-6 py-3 text-sm",
  icon: "h-8 w-8",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

function joinClasses(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  const resolvedSize = variant === "secondaryIcon" ? "icon" : size;
  return joinClasses(VARIANT_CLASSES[variant], SIZE_CLASSES[resolvedSize], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth = false, className, type = "button", ...props },
  ref
) {
  const resolvedSize = variant === "secondaryIcon" ? "icon" : size;

  return (
    <button
      ref={ref}
      type={type}
      className={joinClasses(VARIANT_CLASSES[variant], SIZE_CLASSES[resolvedSize], fullWidth && "w-full", className)}
      {...props}
    />
  );
});

export default Button;
