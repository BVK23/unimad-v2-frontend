import React from "react";

type HeadingProps = {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
};

export default function Heading({ children, subtitle, className = "" }: HeadingProps) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
      <h1 className="text-[26px] md:text-[28px] font-bold leading-tight tracking-tight text-[#0C0F1A]">{children}</h1>
      {subtitle ? <div className="text-[15px] font-light leading-relaxed text-[#4A5568] max-w-xl space-y-1">{subtitle}</div> : null}
    </div>
  );
}
