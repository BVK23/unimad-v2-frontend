"use client";

import React from "react";
import SkipStepLink from "./SkipStepLink";

type FormShellProps = {
  children: React.ReactNode;
  width?: "narrow" | "wide";
  className?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  as?: "form" | "div";
  showSkipStep?: boolean;
};

export default function FormShell({
  children,
  width = "narrow",
  className = "",
  onSubmit,
  as = "div",
  showSkipStep = true,
}: FormShellProps) {
  const widthClass = width === "narrow" ? "max-w-[34rem]" : "max-w-[56rem]";
  const sharedClass = `flex flex-col items-center gap-4 w-full ${widthClass} px-3 ${className}`;
  const footer = showSkipStep ? <SkipStepLink /> : null;

  if (as === "form") {
    return (
      <form onSubmit={onSubmit} className={sharedClass}>
        {children}
        {footer}
      </form>
    );
  }
  return (
    <div className={sharedClass}>
      {children}
      {footer}
    </div>
  );
}
