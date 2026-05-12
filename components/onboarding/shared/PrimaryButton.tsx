import React from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-[#346DE0] text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(52,109,224,0.18)]",
  secondary:
    "bg-[#F8F9FB] text-[#0C0F1A] border border-[rgba(12,15,26,0.07)] hover:border-[rgba(52,109,224,0.2)] hover:bg-[#F0F3F8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-[#4A5568] hover:text-[#346DE0] hover:bg-[#F0F3F8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
};

export default function PrimaryButton({ variant = "primary", fullWidth = false, className = "", type = "button", ...rest }: ButtonProps) {
  const widthClass = fullWidth ? "w-full" : "";
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-[9px] px-6 py-3 text-sm font-semibold transition-colors ${VARIANT_CLASS[variant]} ${widthClass} ${className}`}
    />
  );
}
