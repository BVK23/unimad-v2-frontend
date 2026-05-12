"use client";

import type { OnboardingUserState } from "@/lib/actions/onboardingActions";
import Link from "next/link";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";

type WelcomeProps = {
  name: string;
  userState: OnboardingUserState | null;
  onComplete: () => void;
};

const CONTENT_BY_STATE: Record<OnboardingUserState, { title: (name: string) => string; message: React.ReactNode; buttonText: string }> = {
  NEW_USER: {
    title: name => `Welcome to Unimad, ${name || "friend"}!`,
    message: (
      <div className="space-y-1">
        <p>My name is Unibot.</p>
        <p>I&apos;m here to systemise your job search.</p>
        <p>Answer a few questions to personalise your experience.</p>
      </div>
    ),
    buttonText: "Yes I'm in",
  },
  RETURNING_USER: {
    title: name => `Welcome back ${name || "friend"}!`,
    message: <p>Please continue your onboarding process where you left off.</p>,
    buttonText: "Continue",
  },
  EXISTING_USER: {
    title: name => `Hey ${name || "friend"}!`,
    message: <p>We need a few more details from you.</p>,
    buttonText: "Complete Setup",
  },
  COMPLETED: {
    title: name => `Welcome ${name || "friend"}`,
    message: <p>Let&apos;s get started.</p>,
    buttonText: "Continue",
  },
};

export default function Welcome({ name, userState, onComplete }: WelcomeProps) {
  const safeState = userState ?? "NEW_USER";
  const content = CONTENT_BY_STATE[safeState];

  return (
    <FormShell width="narrow" className="text-center">
      <Heading subtitle={content.message}>{content.title(name)}</Heading>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full justify-center">
        <PrimaryButton
          variant="ghost"
          onClick={() => {
            window.location.href = "/uniboard/resume";
          }}
        >
          I&apos;ll do this later
        </PrimaryButton>
        <PrimaryButton onClick={onComplete}>{content.buttonText}</PrimaryButton>
      </div>

      {safeState !== "RETURNING_USER" ? (
        <p className="mt-3 text-[11px] text-[#8896A8] text-center">
          By continuing, you agree to our{" "}
          <Link href="/tos" target="_blank" className="font-medium text-[#346DE0] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      ) : null}
    </FormShell>
  );
}
