"use client";

import { useCallback, useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { extractResume, saveOnboardingData } from "@/lib/actions/onboardingActions";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import NicheStep from "./NicheStep";
import OnboardingTestPanel from "./OnboardingTestPanel";
import { buildPersonalizationPayload, getPhoneValidationError, isExplorerOnlyGoals, validateLinkedInUrl } from "./helpers";
import {
  FOCUS_OPTIONS,
  GOAL_OPTIONS,
  PRAISE_OPTIONS,
  PROBLEM_OPTIONS,
  STAGE_OPTIONS,
  STRENGTH_OPTIONS,
  type OnboardingOption,
} from "./options";
import ProfileBuilderStep from "./profile-builder/ProfileBuilderStep";
import { TEST_MOCK_NICHE_ROLES, type OnboardingStepKey, type OnboardingTestAnswers, type OnboardingTestConfig } from "./testMode";
import {
  GhostButton,
  OnboardingLoadingScreen,
  OnboardingShell,
  OptionCard,
  PrimaryButton,
  QuestionHeader,
  RESUME_LOADING_MESSAGES,
  TextField,
} from "./ui";

const ENTER_APP = "/uniboard/resume";

const STEP_PROGRESS: Record<OnboardingStepKey, number> = {
  welcome: 0.03,
  name: 0.08,
  phone: 0.14,
  linkedin: 0.2,
  goals: 0.28,
  focus: 0.36,
  stage: 0.44,
  personalize: 0.5,
  resume: 0.58,
  profile_builder: 0.65,
  niche: 0.72,
  strengths: 0.8,
  problems: 0.86,
  praise: 0.92,
  done: 1,
};

const EMPTY: OnboardingTestAnswers = {
  name: "",
  phone: "",
  linkedin: "",
  goals: [],
  focus: [],
  stage: [],
  personalize: null,
  resumeUploaded: false,
  strengths: [],
  problems: [],
  praise: [],
};

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 44 : -44, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -44 : 44, opacity: 0 }),
};

function toggle(list: string[], id: string, max?: number): string[] {
  if (list.includes(id)) return list.filter(v => v !== id);
  if (max && list.length >= max) return list;
  return [...list, id];
}

export default function UniboardOnboardingFlow({
  initialMode = null,
  testConfig = null,
}: {
  initialMode?: "niche" | "strengths" | null;
  testConfig?: OnboardingTestConfig | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingTestAnswers>(() => (testConfig ? { ...testConfig.answers } : { ...EMPTY }));
  const [stack, setStack] = useState<OnboardingStepKey[]>(() => {
    if (testConfig) return [testConfig.initialStep];
    if (initialMode === "niche") return ["niche"];
    if (initialMode === "strengths") return ["strengths"];
    return ["welcome"];
  });
  const [skipSave, setSkipSave] = useState(() => testConfig?.skipSave ?? false);
  const [mockNiche, setMockNiche] = useState(() => testConfig?.mockNiche ?? false);
  const [direction, setDirection] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = stack[stack.length - 1];

  const set = (patch: Partial<OnboardingTestAnswers>) => setAnswers(prev => ({ ...prev, ...patch }));

  const saveData = async (type: Parameters<typeof saveOnboardingData>[0], data: Record<string, unknown>) => {
    if (skipSave) {
      console.info("[onboarding test] skip save", type, data);
      return;
    }
    await saveOnboardingData(type, data);
  };

  const go = (next: OnboardingStepKey) => {
    setDirection(1);
    setStack(s => [...s, next]);
  };

  const back = () => {
    setDirection(-1);
    setStack(s => (s.length > 1 ? s.slice(0, -1) : s));
  };

  const persistPersonalization = async (patch: Partial<OnboardingTestAnswers> = {}) => {
    const merged = { ...answers, ...patch };
    await saveData("personalization_profile", {
      profile: buildPersonalizationPayload({
        goals: merged.goals,
        focus: merged.focus,
        stage: merged.stage,
        personalize: merged.personalize,
        strengths: merged.strengths,
        problems: merged.problems,
        praise: merged.praise,
        resumeUploaded: merged.resumeUploaded,
      }),
    });
    if (merged.goals.length > 0) {
      await saveData("goal", { goal: merged.goals[0] });
    }
  };

  const enterApp = useCallback(() => {
    router.push(ENTER_APP);
    router.refresh();
  }, [router]);

  const finishAndEnter = async () => {
    setBusy(true);
    try {
      if (!skipSave) {
        await persistPersonalization();
        await saveData("complete_minimal", {});
      } else {
        console.info("[onboarding test] skip save — navigating to", ENTER_APP);
      }
      enterApp();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const jumpToTestStep = (step: OnboardingStepKey, nextAnswers: OnboardingTestAnswers) => {
    setDirection(1);
    setStack([step]);
    setAnswers(nextAnswers);
    setError(null);
  };

  const showBack = stack.length > 1 && current !== "done";

  if (current === "profile_builder") {
    return (
      <>
        <ProfileBuilderStep
          preferredName={answers.name}
          personalization={buildPersonalizationPayload({
            goals: answers.goals,
            focus: answers.focus,
            stage: answers.stage,
            personalize: answers.personalize,
            strengths: answers.strengths,
            problems: answers.problems,
            praise: answers.praise,
            resumeUploaded: answers.resumeUploaded,
          })}
          skipSave={skipSave}
          onBack={back}
          onComplete={async () => {
            set({ resumeUploaded: true });
            await persistPersonalization({ resumeUploaded: true });
            go("niche");
          }}
        />
        {testConfig ? (
          <OnboardingTestPanel
            config={{ ...testConfig, skipSave, mockNiche }}
            currentStep={current}
            answers={answers}
            onJumpToStep={jumpToTestStep}
            onSkipSaveChange={setSkipSave}
            onMockNicheChange={setMockNiche}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className={testConfig ? "pb-52" : undefined}>
        <OnboardingShell progress={STEP_PROGRESS[current]} onBack={back} showBack={showBack}>
          {busy ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="animate-spin text-[#346DE0]" size={28} />
              <p className="text-sm text-[#4A5568]">Saving…</p>
            </div>
          ) : null}

          {error ? (
            <p className="mb-4 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={busy ? "pointer-events-none opacity-0" : undefined}
            >
              {current === "welcome" && <WelcomeStep onStart={() => go("name")} />}

              {current === "name" && (
                <NameStep
                  value={answers.name}
                  onChange={v => set({ name: v })}
                  onNext={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await saveData("preferred_name", { preferred_name: answers.name.trim() });
                      go("phone");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to save name");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {current === "phone" && (
                <PhoneStep
                  value={answers.phone}
                  onChange={v => set({ phone: v })}
                  onNext={async phone => {
                    await saveData("whatsapp", { whatsapp_number: phone });
                    go("linkedin");
                  }}
                />
              )}

              {current === "linkedin" && (
                <LinkedInStep
                  value={answers.linkedin}
                  onChange={v => set({ linkedin: v })}
                  onContinue={async url => {
                    await saveData("linkedin_url", { linkedin_url: url });
                    go("goals");
                  }}
                  onSkip={() => go("goals")}
                />
              )}

              {current === "goals" && (
                <GoalsStep name={answers.name} value={answers.goals} onChange={v => set({ goals: v })} onNext={() => go("focus")} />
              )}

              {current === "focus" && <FocusStep value={answers.focus} onChange={v => set({ focus: v })} onNext={() => go("stage")} />}

              {current === "stage" && (
                <StageStep
                  value={answers.stage}
                  onChange={v => set({ stage: v })}
                  onNext={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await persistPersonalization();
                      if (isExplorerOnlyGoals(answers.goals)) {
                        await finishAndEnter();
                      } else {
                        go("personalize");
                      }
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to save");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {current === "personalize" && (
                <PersonalizeStep
                  name={answers.name}
                  onYes={async () => {
                    set({ personalize: true });
                    await persistPersonalization({ personalize: true });
                    go("resume");
                  }}
                  onSkip={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      set({ personalize: false });
                      if (!skipSave) {
                        await persistPersonalization({ personalize: false });
                        await saveData("complete_minimal", {});
                      } else {
                        console.info("[onboarding test] skip save — navigating to", ENTER_APP);
                      }
                      enterApp();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to save");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {current === "resume" && (
                <ResumeStep
                  onUploaded={async file => {
                    setError(null);
                    try {
                      const formData = new FormData();
                      formData.append("resume", file);
                      if (skipSave) {
                        console.info("[onboarding test] skip resume extract", file.name);
                      } else {
                        await extractResume(formData);
                      }
                      set({ resumeUploaded: true });
                      await persistPersonalization({ resumeUploaded: true });
                      go("niche");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to read resume");
                      throw e;
                    }
                  }}
                  onBuildWithUnibot={() => go("profile_builder")}
                />
              )}

              {current === "niche" && (
                <NicheStep
                  name={answers.name}
                  mockRoles={mockNiche ? TEST_MOCK_NICHE_ROLES : undefined}
                  onNext={async (role, allRoles) => {
                    setBusy(true);
                    setError(null);
                    try {
                      await saveData("desired_roles", { role: allRoles.filter(Boolean) });
                      go("strengths");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to save role");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {current === "strengths" && (
                <MultiSelectStep
                  title={answers.name.trim() ? `Now the fun part, ${answers.name.trim()}` : "Now the fun part"}
                  subtitle="What comes naturally to you?"
                  options={STRENGTH_OPTIONS}
                  value={answers.strengths}
                  max={4}
                  onChange={v => set({ strengths: v })}
                  onNext={() => go("problems")}
                  onSkip={async () => {
                    setError(null);
                    await finishAndEnter();
                  }}
                  skipLabel="Skip for now"
                />
              )}

              {current === "problems" && (
                <MultiSelectStep
                  title="What problems do you love solving?"
                  options={PROBLEM_OPTIONS}
                  value={answers.problems}
                  max={3}
                  onChange={v => set({ problems: v })}
                  onNext={() => go("praise")}
                />
              )}

              {current === "praise" && (
                <MultiSelectStep
                  title="What do people praise you for?"
                  options={PRAISE_OPTIONS}
                  value={answers.praise}
                  max={3}
                  onChange={v => set({ praise: v })}
                  onNext={async () => {
                    setBusy(true);
                    try {
                      await persistPersonalization();
                      go("done");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}

              {current === "done" && <DoneStep name={answers.name} onEnter={finishAndEnter} />}
            </motion.div>
          </AnimatePresence>
        </OnboardingShell>
      </div>

      {testConfig ? (
        <OnboardingTestPanel
          config={{ ...testConfig, skipSave, mockNiche }}
          currentStep={current}
          answers={answers}
          onJumpToStep={jumpToTestStep}
          onSkipSaveChange={setSkipSave}
          onMockNicheChange={setMockNiche}
        />
      ) : null}
    </>
  );
}

function MultiSelectStep({
  title,
  subtitle,
  options,
  value,
  onChange,
  onNext,
  onSkip,
  skipLabel = "Skip for now",
  max,
}: {
  title: string;
  subtitle?: string;
  options: OnboardingOption[];
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  max?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader title={title} subtitle={subtitle} />
      <div className="grid w-full gap-2.5 sm:grid-cols-2">
        {options.map(opt => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={value.includes(opt.id)}
            onClick={() => onChange(toggle(value, opt.id, max))}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <PrimaryButton onClick={onNext} disabled={value.length === 0}>
            Continue
          </PrimaryButton>
          {max ? (
            <span className="text-xs text-[#A9B4C2]">
              {value.length}/{max} selected
            </span>
          ) : null}
        </div>
        {onSkip ? <GhostButton onClick={onSkip}>{skipLabel}</GhostButton> : null}
      </div>
    </div>
  );
}

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <QuestionHeader
        title="Welcome to Unimad"
        subtitle="A few quick questions so we can help in a way that fits you. Takes about 2 minutes."
      />
      <PrimaryButton onClick={onStart}>Let&apos;s get started</PrimaryButton>
    </div>
  );
}

function NameStep({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  const canNext = value.trim().length > 0;
  return (
    <div className="flex flex-col items-center gap-7">
      <QuestionHeader title="What should we call you?" subtitle="We'll use this to keep things personal." />
      <div className="w-full max-w-md">
        <TextField value={value} onChange={onChange} placeholder="Your first name" autoFocus onEnter={() => canNext && onNext()} />
      </div>
      <PrimaryButton onClick={onNext} disabled={!canNext}>
        Continue
      </PrimaryButton>
    </div>
  );
}

function PhoneStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: (phone: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const phoneValue = value || undefined;

  const inputClassName =
    "flex-1 min-w-0 rounded-[14px] border bg-white px-4 py-3.5 text-[16px] text-[#0C0F1A] placeholder:text-[#A9B4C2] focus:outline-none focus:border-[#346DE0] focus:ring-2 focus:ring-[#346DE0]/15";

  const countrySelectClassName =
    "rounded-[14px] border bg-white px-2 py-3.5 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0] focus:ring-2 focus:ring-[#346DE0]/15";

  const fieldBorderClass = error ? "border-rose-300" : "border-[rgba(12,15,26,0.12)]";

  const handleContinue = async () => {
    const validationError = getPhoneValidationError(phoneValue, isValidPhoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onNext(phoneValue!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your number. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-7">
      <QuestionHeader title="What's your WhatsApp number?" subtitle="We'll only reach out about things that matter to your search." />
      <div className="w-full max-w-md">
        <div
          className={`[&_.PhoneInput]:flex [&_.PhoneInput]:w-full [&_.PhoneInput]:items-stretch [&_.PhoneInput]:gap-2 ${error ? "[&_.PhoneInputCountry]:border-rose-300" : ""}`}
        >
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry="IN"
            value={phoneValue}
            onChange={next => {
              onChange(next ?? "");
              if (error) setError(null);
            }}
            className="w-full"
            numberInputProps={{
              className: `${inputClassName} ${fieldBorderClass}`,
              placeholder: "Phone number",
            }}
            countrySelectProps={{
              className: `${countrySelectClassName} ${fieldBorderClass}`,
            }}
          />
        </div>
        {error ? <p className="mt-2 text-left text-sm text-rose-600">{error}</p> : null}
      </div>
      <PrimaryButton onClick={handleContinue} disabled={saving}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </div>
  );
}

function LinkedInStep({
  value,
  onChange,
  onContinue,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: (url: string) => Promise<void>;
  onSkip: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    const validationError = validateLinkedInUrl(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onContinue(value.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your LinkedIn URL. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-7">
      <QuestionHeader title="Add your LinkedIn" subtitle="Optional. Helps us tailor suggestions faster." />
      <div className="w-full max-w-md">
        <TextField
          value={value}
          error={error}
          onChange={v => {
            onChange(v);
            if (error) setError(null);
          }}
          placeholder="linkedin.com/in/…"
          autoFocus
          onEnter={handleContinue}
        />
      </div>
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={handleContinue} disabled={saving}>
          {saving ? "Saving…" : "Continue"}
        </PrimaryButton>
        <GhostButton onClick={onSkip} disabled={saving}>
          Skip for now
        </GhostButton>
      </div>
    </div>
  );
}

function GoalsStep({
  name,
  value,
  onChange,
  onNext,
}: {
  name: string;
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
}) {
  const MAX = 3;
  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader
        title={name.trim() ? `Nice to meet you, ${name.trim()}. What brings you here?` : "What brings you to Unimad?"}
        subtitle="Pick up to 3."
      />
      <div className="grid w-full gap-2.5 sm:grid-cols-2">
        {GOAL_OPTIONS.map(opt => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={value.includes(opt.id)}
            onClick={() => onChange(toggle(value, opt.id, MAX))}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <PrimaryButton onClick={onNext} disabled={value.length === 0}>
          Continue
        </PrimaryButton>
        <span className="text-xs text-[#A9B4C2]">
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  );
}

function FocusStep({ value, onChange, onNext }: { value: string[]; onChange: (v: string[]) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader title="What should we help you with?" subtitle="Choose all that apply." />
      <div className="flex w-full flex-col gap-2.5">
        {FOCUS_OPTIONS.map(opt => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={value.includes(opt.id)}
            onClick={() => onChange(toggle(value, opt.id))}
          />
        ))}
      </div>
      <PrimaryButton onClick={onNext} disabled={value.length === 0}>
        Continue
      </PrimaryButton>
    </div>
  );
}

function StageStep({ value, onChange, onNext }: { value: string[]; onChange: (v: string[]) => void; onNext: () => void }) {
  const selected = value[0] ?? "";
  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader title="Where are you in your journey?" subtitle="Pick the one that fits best." />
      <div className="grid w-full gap-2.5 sm:grid-cols-2">
        {STAGE_OPTIONS.map(opt => (
          <OptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected === opt.id}
            onClick={() => onChange([opt.id])}
          />
        ))}
      </div>
      <PrimaryButton onClick={onNext} disabled={!selected}>
        Continue
      </PrimaryButton>
    </div>
  );
}

function PersonalizeStep({ name, onYes, onSkip }: { name: string; onYes: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center gap-7">
      <QuestionHeader
        title={name.trim() ? `Want Unimad tailored to you, ${name.trim()}?` : "Want Unimad tailored to you?"}
        subtitle="Add your resume and answer a few strength questions (~2 min)."
      />
      <div className="flex w-full max-w-md flex-col gap-2.5">
        <PrimaryButton onClick={onYes} fullWidth>
          Yes, personalize my experience
        </PrimaryButton>
        <GhostButton onClick={onSkip} fullWidth>
          Skip for now
        </GhostButton>
      </div>
    </div>
  );
}

function ResumeStep({ onUploaded, onBuildWithUnibot }: { onUploaded: (file: File) => Promise<void>; onBuildWithUnibot: () => void }) {
  const [mode, setMode] = useState<"choose" | "uploading" | "noresume">("choose");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported for now.");
      return;
    }
    setMode("uploading");
    try {
      await onUploaded(file);
    } catch {
      setMode("choose");
    }
  };

  if (mode === "uploading") {
    return <OnboardingLoadingScreen messages={RESUME_LOADING_MESSAGES} />;
  }

  if (mode === "noresume") {
    return (
      <div className="flex flex-col items-center gap-7 text-center">
        <QuestionHeader title="No resume yet?" subtitle="Build your first resume with an interactive chat with Unibot." />
        <div className="flex w-full max-w-md flex-col gap-2.5">
          <PrimaryButton onClick={onBuildWithUnibot} fullWidth>
            Build with Unibot
          </PrimaryButton>
          <GhostButton onClick={() => setMode("choose")} fullWidth>
            Upload instead
          </GhostButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <QuestionHeader title="Start with your resume" subtitle="Upload a PDF and we'll extract your profile automatically." />
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full max-w-md flex-col items-center gap-2 rounded-[18px] border-2 border-dashed border-[#346DE0]/35 bg-[#F0F6FE]/50 px-6 py-12"
      >
        <span className="text-[15px] font-semibold">Drop PDF or click to upload</span>
      </button>
      <button type="button" onClick={() => setMode("noresume")} className="text-sm text-[#4A5568] underline">
        I don&apos;t have a resume yet
      </button>
    </div>
  );
}

function DoneStep({ name, onEnter }: { name: string; onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <QuestionHeader title={name.trim() ? `You're all set, ${name.trim()}!` : "You're all set!"} subtitle="Your workspace is ready." />
      <PrimaryButton onClick={onEnter}>Enter Unimad</PrimaryButton>
    </div>
  );
}
