"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useOnboardingStore, type OnboardingAnswers } from "@/features/onboarding/useOnboardingStore";
import { extractResume } from "@/lib/actions/onboardingActions";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import NicheStep from "./NicheStep";
import OnboardingTestPanel from "./OnboardingTestPanel";
import { buildPersonalizationPayload, getPhoneValidationError, isExplorerOnlyGoals, validateLinkedInUrl } from "./helpers";
// TODO(product): Re-enable STRENGTH_OPTIONS / PROBLEM_OPTIONS / PRAISE_OPTIONS when voice personalisation is wired into agents.
import { GOAL_OPTIONS, STAGE_OPTIONS, type OnboardingOption } from "./options";
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
  goals: 0.3,
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
  initialMode?: "niche" | "strengths" | "profile_setup" | null;
  testConfig?: OnboardingTestConfig | null;
}) {
  const router = useRouter();

  const answers = useOnboardingStore(s => s.answers);
  const skipSave = useOnboardingStore(s => s.skipSave);
  const setAnswers = useOnboardingStore(s => s.setAnswers);
  const setSkipSave = useOnboardingStore(s => s.setSkipSave);
  const save = useOnboardingStore(s => s.save);
  const retryFailed = useOnboardingStore(s => s.retryFailed);
  const flush = useOnboardingStore(s => s.flush);
  const initFlow = useOnboardingStore(s => s.initFlow);
  const replaceAnswers = useOnboardingStore(s => s.replaceAnswers);

  const [stack, setStack] = useState<OnboardingStepKey[]>(() => {
    if (testConfig) return [testConfig.initialStep];
    if (initialMode === "niche") return ["niche"];
    if (initialMode === "strengths") return ["strengths"];
    // Minimal-onboarded users returning to finish resume + niche.
    if (initialMode === "profile_setup") return ["resume"];
    return ["welcome"];
  });
  const [mockNiche, setMockNiche] = useState(() => testConfig?.mockNiche ?? false);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const current = stack[stack.length - 1];

  // Reset the store once per mount (the page remounts via key when test params change).
  useEffect(() => {
    initFlow({ answers: testConfig ? { ...testConfig.answers } : { ...EMPTY }, skipSave: testConfig?.skipSave ?? false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<OnboardingAnswers>) => setAnswers(patch);

  // Advance to the next step, re-sending any previously-failed saves as we go.
  const go = (next: OnboardingStepKey) => {
    retryFailed();
    setDirection(1);
    setStack(s => [...s, next]);
  };

  const back = () => {
    setDirection(-1);
    setStack(s => (s.length > 1 ? s.slice(0, -1) : s));
  };

  // Optimistically persist the personalization blob (+ goal). Non-blocking; deduped in the store.
  const syncPersonalization = (patch: Partial<OnboardingAnswers> = {}) => {
    const merged = { ...useOnboardingStore.getState().answers, ...patch };
    save("personalization_profile", {
      profile: buildPersonalizationPayload({
        goals: merged.goals,
        focus: merged.focus,
        personalize: merged.personalize,
        strengths: merged.strengths,
        problems: merged.problems,
        praise: merged.praise,
        resumeUploaded: merged.resumeUploaded,
      }),
    });
    if (merged.goals.length > 0) {
      save("goal", { goal: merged.goals[0] });
    }
    if (merged.stage.length > 0) {
      save("career_stage", { career_stage: merged.stage });
    }
  };

  const enterApp = useCallback(() => {
    router.push(ENTER_APP);
    router.refresh();
  }, [router]);

  const finishAndEnter = (patch: Partial<OnboardingAnswers> = {}) => {
    syncPersonalization(patch);
    save("complete_minimal", {});
    enterApp();
    void flush().catch(err => console.warn("[onboarding] background flush failed", err));
  };

  const jumpToTestStep = (step: OnboardingStepKey, nextAnswers: OnboardingTestAnswers) => {
    setDirection(1);
    setStack([step]);
    replaceAnswers(nextAnswers);
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
            syncPersonalization({ resumeUploaded: true });
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
            >
              {current === "welcome" && <WelcomeStep onStart={() => go("name")} />}

              {current === "name" && (
                <NameStep
                  value={answers.name}
                  onChange={v => set({ name: v })}
                  onNext={() => {
                    setError(null);
                    save("preferred_name", { preferred_name: answers.name.trim() });
                    go("phone");
                  }}
                />
              )}

              {current === "phone" && (
                <PhoneStep
                  value={answers.phone}
                  onChange={v => set({ phone: v })}
                  onNext={phone => {
                    save("whatsapp", { whatsapp_number: phone });
                    go("linkedin");
                  }}
                />
              )}

              {current === "linkedin" && (
                <LinkedInStep
                  value={answers.linkedin}
                  onChange={v => set({ linkedin: v })}
                  onContinue={url => {
                    if (skipSave) {
                      console.info("[onboarding test] skip save", "linkedin_url", url);
                      go("goals");
                      return;
                    }
                    save("linkedin_url", { linkedin_url: url });
                    go("goals");
                  }}
                  onSkip={() => go("goals")}
                />
              )}

              {current === "goals" && (
                <GoalsStep
                  name={answers.name}
                  value={answers.goals}
                  onChange={v => set({ goals: v })}
                  onNext={() => {
                    syncPersonalization();
                    go("stage");
                  }}
                />
              )}

              {current === "stage" && (
                <StageStep
                  value={answers.stage}
                  onChange={v => set({ stage: v })}
                  onNext={() => {
                    setError(null);
                    syncPersonalization();
                    if (isExplorerOnlyGoals(answers.goals)) {
                      finishAndEnter();
                    } else {
                      go("personalize");
                    }
                  }}
                />
              )}

              {current === "personalize" && (
                <PersonalizeStep
                  name={answers.name}
                  onYes={() => {
                    set({ personalize: true });
                    syncPersonalization({ personalize: true });
                    go("resume");
                  }}
                  onSkip={() => {
                    setError(null);
                    set({ personalize: false });
                    finishAndEnter({ personalize: false });
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
                      syncPersonalization({ resumeUploaded: true });
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
                  liveDiscovery={!mockNiche}
                  onNext={async (_role, allRoles) => {
                    setError(null);
                    save("desired_roles", { role: allRoles.filter(Boolean) });
                    // TODO(product): After niche used to go to strengths → problems → praise.
                    // Deferred until voice personalisation is wired into agents. Niche → done → product.
                    syncPersonalization();
                    save("complete_minimal", {});
                    go("done");
                  }}
                />
              )}

              {/*
              TODO(product): Re-enable strengths / problems / praise steps once agents actually use them.
              See options.ts STRENGTH_OPTIONS / PROBLEM_OPTIONS / PRAISE_OPTIONS and helpers.buildPersonalizationPayload.
              */}

              {current === "done" && <DoneStep name={answers.name} onEnter={() => finishAndEnter()} />}
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

function PhoneStep({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: (phone: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const phoneValue = value || undefined;

  const inputClassName =
    "flex-1 min-w-0 rounded-[14px] border bg-white px-4 py-3.5 text-[16px] text-[#0C0F1A] placeholder:text-[#A9B4C2] focus:outline-none focus:border-[#346DE0] focus:ring-2 focus:ring-[#346DE0]/15";

  const countrySelectClassName =
    "rounded-[14px] border bg-white px-2 py-3.5 text-sm font-medium text-[#0C0F1A] focus:outline-none focus:border-[#346DE0] focus:ring-2 focus:ring-[#346DE0]/15";

  const fieldBorderClass = error ? "border-rose-300" : "border-[rgba(12,15,26,0.12)]";

  const handleContinue = () => {
    const validationError = getPhoneValidationError(phoneValue, isValidPhoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onNext(phoneValue!);
  };

  return (
    <div className="flex flex-col items-center gap-7">
      <QuestionHeader title="What's your WhatsApp number?" subtitle="We'll only reach out about things that matter to your search." />
      <div className="onboarding-phone-input relative z-[60] w-full max-w-md overflow-visible">
        <div
          className={`[&_.PhoneInput]:flex [&_.PhoneInput]:w-full [&_.PhoneInput]:items-stretch [&_.PhoneInput]:gap-2 [&_.PhoneInputCountry]:relative [&_.PhoneInputCountry]:z-[70] ${error ? "[&_.PhoneInputCountry]:border-rose-300" : ""}`}
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
              onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleContinue();
              },
            }}
            countrySelectProps={{
              className: `${countrySelectClassName} ${fieldBorderClass}`,
            }}
          />
        </div>
        {error ? <p className="mt-2 text-left text-sm text-rose-600">{error}</p> : null}
      </div>
      <style jsx global>{`
        .onboarding-phone-input .PhoneInputCountry {
          position: relative;
          z-index: 70;
        }
        .onboarding-phone-input .PhoneInputCountrySelect {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        .onboarding-phone-input .PhoneInputCountryIcon {
          z-index: 1;
        }
      `}</style>
      <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
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
  onContinue: (url: string) => void;
  onSkip: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    const validationError = validateLinkedInUrl(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onContinue(value.trim());
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
        <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
        <GhostButton onClick={onSkip}>Skip for now</GhostButton>
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
        subtitle="Pick up to 3. We'll tailor everything around these."
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
