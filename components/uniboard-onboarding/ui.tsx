"use client";

import React, { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Loader2 } from "lucide-react";

export const RESUME_LOADING_MESSAGES = [
  "Reading your resume…",
  "Going through your education…",
  "Reviewing your experience…",
  "Scanning your skills…",
  "Checking projects…",
  "Looking at certifications…",
  "Analyzing deeply…",
  "Building your personalization…",
  "Getting your profile figured out…",
];

export const NICHE_LOADING_MESSAGES = [
  "Reading the details you've entered…",
  "Analyzing your resume…",
  "Reviewing your skills and experience…",
  "Understanding your career goals…",
  "Doing market research…",
  "Searching the internet for live demand…",
  "Matching roles to your profile…",
  "Checking what recruiters are hiring for…",
  "Working on your request…",
  "Finalising your niche…",
  "Just a moment more…",
];

function useLoadingMessages(messages: string[], intervalMs = 1400) {
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, messages.length - 1);

  useEffect(() => {
    if (messages.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex(prev => (prev >= maxIndex ? maxIndex : prev + 1));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, maxIndex, messages.length]);

  return { message: messages[index] ?? messages[0], index };
}

export function OnboardingLoadingScreen({ messages, intervalMs = 1400 }: { messages: string[]; intervalMs?: number }) {
  const resetKey = messages.join("\0");
  return <OnboardingLoadingScreenInner key={resetKey} messages={messages} intervalMs={intervalMs} />;
}

function OnboardingLoadingScreenInner({ messages, intervalMs = 1400 }: { messages: string[]; intervalMs?: number }) {
  const { message, index } = useLoadingMessages(messages, intervalMs);

  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center" role="status" aria-live="polite" aria-busy="true">
      <Loader2 className="animate-spin text-[#346DE0]" size={32} />
      <p key={index} className="onboarding-loading-message max-w-md text-[20px] font-light leading-relaxed text-[#0C0F1A]">
        {message}
      </p>
      <style jsx>{`
        .onboarding-loading-message {
          animation:
            onboarding-msg-enter 0.45s ease-out forwards,
            onboarding-msg-breathe 2.4s ease-in-out 0.45s infinite;
        }
        @keyframes onboarding-msg-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 0.72;
            transform: translateY(0);
          }
        }
        @keyframes onboarding-msg-breathe {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(0.99);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export function OnboardingShell({
  children,
  progress,
  onBack,
  showBack,
}: {
  children: React.ReactNode;
  progress: number;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col text-[#0C0F1A]"
      style={{ background: "#F8F9FB", fontFamily: "'Onest', system-ui, sans-serif" }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#346DE0]/[0.06] blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[rgba(12,15,26,0.06)] bg-white/85 backdrop-blur-md">
        <div className="flex h-16 items-center px-5 md:px-8">
          <Logo className="h-7 w-auto" />
        </div>
        <div className="h-[3px] w-full bg-[#EAEEF4]">
          <div
            className="h-full bg-[#346DE0] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(3, Math.min(100, progress * 100))}%` }}
          />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 md:px-8">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="absolute left-5 top-6 z-20 text-sm font-medium text-[#8896A8] transition-colors hover:text-[#346DE0] md:left-8"
          >
            Back
          </button>
        ) : null}
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}

export function QuestionHeader({
  title,
  subtitle,
  align = "center",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={`flex flex-col gap-3.5 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      <h1 className="text-[40px] font-normal leading-[1.1] tracking-tight text-[#0C0F1A]">{title}</h1>
      {subtitle ? <p className="max-w-xl text-[18px] font-light leading-relaxed text-[#4A5568]">{subtitle}</p> : null}
    </div>
  );
}

export function OptionCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[16px] border bg-white p-4 text-left transition-all duration-200 ${
        selected ? "border-[#346DE0]" : "border-[rgba(12,15,26,0.08)] hover:border-[#346DE0]/45"
      }`}
    >
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-normal text-[#0C0F1A]">{label}</span>
        {description ? <span className="mt-0.5 line-clamp-2 text-[13px] font-light leading-snug text-[#8896A8]">{description}</span> : null}
      </span>
      <span
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] border transition-all ${
          selected ? "border-[#346DE0] bg-[#346DE0]" : "border-[rgba(12,15,26,0.2)] bg-white group-hover:border-[#346DE0]/50"
        }`}
      >
        {selected ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.3 5 8.7 9.5 3.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  onEnter,
  type = "text",
  autoFocus,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  type?: string;
  autoFocus?: boolean;
  error?: string | null;
}) {
  const borderClass = error
    ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-200/60"
    : "border-[rgba(12,15,26,0.12)] focus-within:border-[#346DE0] focus-within:ring-[#346DE0]/15";

  return (
    <div className="w-full">
      <div
        className={`flex w-full items-center gap-2 rounded-[14px] border bg-white px-4 py-3.5 transition-all focus-within:ring-2 ${borderClass}`}
      >
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && onEnter) onEnter();
          }}
          className="w-full bg-transparent text-[16px] text-[#0C0F1A] placeholder:text-[#A9B4C2] focus:outline-none"
          aria-invalid={Boolean(error)}
        />
      </div>
      {error ? <p className="mt-2 text-left text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-[12px] bg-[#346DE0] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_rgba(52,109,224,0.28)] transition-all hover:bg-[#2c60c9] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-[12px] px-6 py-3.5 text-[15px] font-medium text-[#4A5568] transition-colors hover:bg-[#EEF1F6] hover:text-[#0C0F1A] disabled:opacity-40 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}
