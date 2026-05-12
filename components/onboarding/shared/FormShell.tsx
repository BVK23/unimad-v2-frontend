import React from "react";

type FormShellProps = {
  children: React.ReactNode;
  width?: "narrow" | "wide";
  className?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  as?: "form" | "div";
};

export default function FormShell({ children, width = "narrow", className = "", onSubmit, as = "div" }: FormShellProps) {
  const widthClass = width === "narrow" ? "max-w-[34rem]" : "max-w-[56rem]";
  const sharedClass = `flex flex-col items-center gap-4 w-full ${widthClass} px-3 ${className}`;

  if (as === "form") {
    return (
      <form onSubmit={onSubmit} className={sharedClass}>
        {children}
      </form>
    );
  }
  return <div className={sharedClass}>{children}</div>;
}
