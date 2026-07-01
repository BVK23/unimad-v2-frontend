"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingStep, OnboardingStepName } from "@/features/onboarding/types";
import { buildOnboardingProfileSummary } from "@/features/onboarding/utils/profileSummary";
import type { OnboardingProfileSummary } from "@/features/onboarding/utils/profileSummary";
import {
  fetchOnboardingCheckpoints,
  fetchOnboardingSavedProfile,
  getUserOnboardingState,
  type OnboardingCheckpoints,
  type OnboardingUserState,
} from "@/lib/actions/onboardingActions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DesiredRoleForm from "./DesiredRoleForm";
import EducationForm from "./EducationForm";
import ExperienceForm from "./ExperienceForm";
import GoalForm from "./GoalForm";
import LinkedInForm from "./LinkedInForm";
import NameForm from "./NameForm";
import ProjectsForm from "./ProjectsForm";
import ResumeOptionsForm from "./ResumeOptionsForm";
import SkillsForm from "./SkillsForm";
import Welcome from "./Welcome";
import WhatsAppForm from "./WhatsAppForm";

const ONBOARDING_QUERY_KEY = ["onboardingSteps"] as const;
const REQUIRED_STEP_NAMES = new Set<OnboardingStepName>(["welcome", "whatsapp", "linkedin"]);
const PROFILE_FLOW_STEPS: OnboardingStepName[] = ["educations", "experiences", "projects", "skills"];

type ProfileFlowMode = "normal" | "manual";

type OnboardingState = {
  steps: OnboardingStep[];
  name: string;
  userState: OnboardingUserState;
  currentStepIndex: number;
  /** Stack of step indices the user actually saw before landing on currentStepIndex. */
  history: number[];
  profileFlowMode: ProfileFlowMode;
  /** Bumped each time the user re-enters the manual profile flow so forms remount with saved data. */
  manualFlowSession: number;
  profileSummary: OnboardingProfileSummary;
};

const buildRequiredSteps = (checkpoints: OnboardingCheckpoints): OnboardingStep[] => [
  { name: "welcome", completed: false, required: true },
  { name: "whatsapp", completed: Boolean(checkpoints.phone_number), required: true },
  { name: "linkedin", completed: Boolean(checkpoints.linkedin_url), required: true },
];

const buildOptionalSteps = (checkpoints: OnboardingCheckpoints): OnboardingStep[] => [
  { name: "name", completed: Boolean(checkpoints.preferred_name), required: false },
  {
    name: "resume",
    completed: Boolean(checkpoints.education || checkpoints.experience || checkpoints.project || checkpoints.skill),
    required: false,
  },
  { name: "educations", completed: Boolean(checkpoints.education), required: false },
  { name: "experiences", completed: Boolean(checkpoints.experience), required: false },
  { name: "projects", completed: Boolean(checkpoints.project), required: false },
  { name: "skills", completed: Boolean(checkpoints.skill), required: false },
  { name: "role", completed: Boolean(checkpoints.role), required: false },
  { name: "goal", completed: Boolean(checkpoints.goal), required: false },
];

const buildSteps = (checkpoints: OnboardingCheckpoints, userState: OnboardingUserState): OnboardingStep[] => {
  const requiredSteps = buildRequiredSteps(checkpoints);
  const optionalSteps = buildOptionalSteps(checkpoints);
  return userState === "MINIMAL_COMPLETE" ? optionalSteps : [...requiredSteps, ...optionalSteps];
};

const getStepIndex = (steps: OnboardingStep[], name: OnboardingStepName) => steps.findIndex(step => step.name === name);

const getNextIncompleteAfter = (steps: OnboardingStep[], afterIndex: number) =>
  steps.findIndex((step, index) => index > afterIndex && !step.completed);

const getNextProfileFlowIndex = (steps: OnboardingStep[], currentName: OnboardingStepName) => {
  const currentPos = PROFILE_FLOW_STEPS.indexOf(currentName);
  if (currentPos === -1) return -1;
  for (let i = currentPos + 1; i < PROFILE_FLOW_STEPS.length; i += 1) {
    const idx = getStepIndex(steps, PROFILE_FLOW_STEPS[i]);
    if (idx !== -1) return idx;
  }
  return -1;
};

const getFirstMissingProfileFlowIndex = (steps: OnboardingStep[], completedSections: OnboardingStepName[]) => {
  for (const stepName of PROFILE_FLOW_STEPS) {
    if (completedSections.includes(stepName)) continue;
    const idx = getStepIndex(steps, stepName);
    if (idx !== -1) return idx;
  }
  return -1;
};

const pushHistory = (history: number[], currentIndex: number) => (currentIndex >= 0 ? [...history, currentIndex] : history);

const RedirectingState = () => (
  <div className="flex flex-col items-center gap-3 mt-10">
    <Loader2 size={28} className="animate-spin text-[#346DE0]" />
    <span className="text-sm text-[#4A5568]">Wrapping things up…</span>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center gap-3 mt-10">
    <Loader2 size={28} className="animate-spin text-[#346DE0]" />
    <span className="text-sm text-[#4A5568]">Loading your onboarding…</span>
  </div>
);

export default function OnboardingFlow() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const masterclassIntent = searchParams.get("masterclass_intent");
  const navigate = searchParams.get("navigate");
  const navigateTab = searchParams.get("tab");

  const getPostOnboardingPath = useCallback(() => {
    if (navigate === "unicoach" || masterclassIntent === "discovery") {
      return `/uniboard/unicoach?tab=${navigateTab || "niche"}`;
    }
    if (masterclassIntent === "video") {
      return "/masterclass?autoplay=1";
    }
    return "/uniboard/resume";
  }, [masterclassIntent, navigate, navigateTab]);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const registerSkipCurrentStep = useOnboardingUIStore(s => s.registerSkipCurrentStep);
  const setCanSkipCurrentStep = useOnboardingUIStore(s => s.setCanSkipCurrentStep);

  const { data, isLoading } = useQuery<OnboardingState | null>({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: async () => {
      const [checkpoints, savedProfile] = await Promise.all([fetchOnboardingCheckpoints(), fetchOnboardingSavedProfile()]);
      const profileSummary = buildOnboardingProfileSummary(savedProfile);
      setUserOnboardingData(savedProfile);

      const userState = await getUserOnboardingState(checkpoints);
      if (userState === "COMPLETED") {
        return {
          steps: [],
          name: checkpoints.name ?? "",
          userState,
          currentStepIndex: 0,
          history: [],
          profileFlowMode: "normal" as const,
          manualFlowSession: 0,
          profileSummary,
        };
      }

      const steps = buildSteps(checkpoints, userState);
      const firstIncompleteIndex = steps.findIndex(step => !step.completed);
      const currentStepIndex = firstIncompleteIndex === -1 ? -1 : firstIncompleteIndex;

      return {
        steps,
        name: checkpoints.name ?? "",
        userState,
        currentStepIndex,
        history: [],
        profileFlowMode: "normal" as const,
        manualFlowSession: 0,
        profileSummary,
      };
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const enterManualProfileFlow = useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);
      if (!current) throw new Error("No onboarding state cached");

      const educationsIdx = getStepIndex(current.steps, "educations");
      if (educationsIdx === -1) throw new Error("Education step missing from onboarding flow");

      return {
        ...current,
        profileFlowMode: "manual" as const,
        manualFlowSession: current.manualFlowSession + 1,
        currentStepIndex: educationsIdx,
        history: pushHistory(current.history, current.currentStepIndex),
      };
    },
    onSuccess: next => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, next);
    },
  });

  const updateStep = useMutation<
    OnboardingState,
    unknown,
    { completedSteps: OnboardingStepName | OnboardingStepName[]; skipExperience?: boolean }
  >({
    mutationFn: async ({ completedSteps, skipExperience }) => {
      const current = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);
      if (!current) throw new Error("No onboarding state cached");
      const updatedSteps = current.steps.map(step => ({ ...step }));
      const currentIndex = current.currentStepIndex;
      const currentStepName = updatedSteps[currentIndex]?.name;

      if (Array.isArray(completedSteps)) {
        completedSteps.forEach(stepName => {
          const idx = getStepIndex(updatedSteps, stepName);
          if (idx !== -1) updatedSteps[idx].completed = true;
        });
        const resumeIdx = getStepIndex(updatedSteps, "resume");
        if (resumeIdx !== -1) updatedSteps[resumeIdx].completed = true;

        const isResumeUpload = completedSteps.some(step => PROFILE_FLOW_STEPS.includes(step));
        if (isResumeUpload) {
          const firstMissingIdx = getFirstMissingProfileFlowIndex(updatedSteps, completedSteps);
          if (firstMissingIdx !== -1) {
            return {
              ...current,
              steps: updatedSteps,
              profileFlowMode: "normal" as const,
              currentStepIndex: firstMissingIdx,
              history: pushHistory(current.history, currentIndex),
            };
          }

          const skillsIdx = getStepIndex(updatedSteps, "skills");
          const nextIdx = getNextIncompleteAfter(updatedSteps, skillsIdx);
          return {
            ...current,
            steps: updatedSteps,
            profileFlowMode: "normal" as const,
            currentStepIndex: nextIdx,
            history: pushHistory(current.history, currentIndex),
          };
        }
      } else if (currentIndex >= 0 && currentIndex < updatedSteps.length) {
        updatedSteps[currentIndex].completed = true;
        if (completedSteps === "experiences" && skipExperience) {
          const projectIdx = getStepIndex(updatedSteps, "projects");
          if (projectIdx !== -1) updatedSteps[projectIdx].required = true;
        }
      }

      if (current.profileFlowMode === "manual" && currentStepName && PROFILE_FLOW_STEPS.includes(currentStepName)) {
        const nextProfileIdx = getNextProfileFlowIndex(updatedSteps, currentStepName);
        if (nextProfileIdx !== -1) {
          return {
            ...current,
            steps: updatedSteps,
            profileFlowMode: "manual" as const,
            currentStepIndex: nextProfileIdx,
            history: pushHistory(current.history, currentIndex),
          };
        }

        const skillsIdx = getStepIndex(updatedSteps, "skills");
        const nextIdx = getNextIncompleteAfter(updatedSteps, skillsIdx);
        return {
          ...current,
          steps: updatedSteps,
          profileFlowMode: "normal" as const,
          currentStepIndex: nextIdx,
          history: pushHistory(current.history, currentIndex),
        };
      }

      const nextIncompleteIdx = getNextIncompleteAfter(updatedSteps, currentIndex);
      return {
        ...current,
        steps: updatedSteps,
        profileFlowMode: "normal" as const,
        currentStepIndex: nextIncompleteIdx,
        history: nextIncompleteIdx !== -1 ? pushHistory(current.history, currentIndex) : current.history,
      };
    },
    onSuccess: (next, variables) => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, next);

      const completedStep = Array.isArray(variables.completedSteps) ? null : variables.completedSteps;
      const phoneDone = next.steps.find(s => s.name === "whatsapp")?.completed;
      const linkedinDone = next.steps.find(s => s.name === "linkedin")?.completed;

      if (completedStep === "linkedin" && phoneDone && linkedinDone) {
        window.setTimeout(() => {
          window.location.href = getPostOnboardingPath();
        }, 100);
      }
    },
  });

  const advanceWithoutCompleting = useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);
      if (!current) throw new Error("No onboarding state cached");
      const currentIndex = current.currentStepIndex;

      let nextIndex = currentIndex + 1;
      while (nextIndex < current.steps.length && current.steps[nextIndex].completed) {
        nextIndex += 1;
      }

      const nextStepIndex = nextIndex >= current.steps.length ? -1 : nextIndex;
      return {
        ...current,
        profileFlowMode: "normal" as const,
        currentStepIndex: nextStepIndex,
        history: nextStepIndex !== -1 ? pushHistory(current.history, currentIndex) : current.history,
      };
    },
    onSuccess: next => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, next);
    },
  });

  const handleSkipCurrentStep = useCallback(() => {
    const current = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);
    if (!current || current.currentStepIndex < 0) return;

    const step = current.steps[current.currentStepIndex];
    switch (step.name) {
      case "resume":
        advanceWithoutCompleting.mutate();
        return;
      case "experiences":
        updateStep.mutate({ completedSteps: "experiences", skipExperience: true });
        return;
      case "projects":
        updateStep.mutate({ completedSteps: "projects" });
        return;
      default:
        advanceWithoutCompleting.mutate();
    }
  }, [advanceWithoutCompleting, queryClient, updateStep]);

  useEffect(() => {
    if (!data || data.currentStepIndex < 0) {
      setCanSkipCurrentStep(false);
      registerSkipCurrentStep(null);
      return;
    }

    const step = data.steps[data.currentStepIndex];
    const isLastStep = data.currentStepIndex === data.steps.length - 1;
    const isRequiredStep = REQUIRED_STEP_NAMES.has(step.name);
    const isProjectsRequired = step.name === "projects" && step.required;

    setCanSkipCurrentStep(!isRequiredStep && !isLastStep && !isProjectsRequired);
    registerSkipCurrentStep(handleSkipCurrentStep);

    return () => {
      registerSkipCurrentStep(null);
      setCanSkipCurrentStep(false);
    };
  }, [data, handleSkipCurrentStep, registerSkipCurrentStep, setCanSkipCurrentStep]);

  const reachedEnd = Boolean(
    data && (data.currentStepIndex >= data.steps.length || data.currentStepIndex === -1 || data.steps.length === 0)
  );

  const liveProfileSummary = useMemo(
    () =>
      buildOnboardingProfileSummary({
        educations: userOnboardingData.educations,
        experiences: userOnboardingData.experiences,
        projects: userOnboardingData.projects,
        skills: userOnboardingData.skills,
      }),
    [userOnboardingData]
  );

  useEffect(() => {
    if (!reachedEnd) return;
    const timeout = window.setTimeout(() => {
      window.location.href = getPostOnboardingPath();
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [getPostOnboardingPath, reachedEnd]);

  if (isLoading) return <LoadingState />;
  if (!data) return <LoadingState />;
  if (reachedEnd) return <RedirectingState />;

  const currentStep = data.steps[data.currentStepIndex];
  const profileFormKey = `${currentStep.name}-${data.manualFlowSession}`;

  switch (currentStep.name) {
    case "welcome":
      return (
        <Welcome
          name={(data.name ?? "").split(" ")[0] ?? ""}
          userState={data.userState}
          onComplete={() => updateStep.mutate({ completedSteps: "welcome" })}
        />
      );
    case "name":
      return <NameForm onComplete={() => updateStep.mutate({ completedSteps: "name" })} />;
    case "resume":
      return (
        <ResumeOptionsForm
          profileSummary={liveProfileSummary}
          onManualEntry={() => enterManualProfileFlow.mutate()}
          onUploadComplete={extractedSections => {
            const completedSteps = extractedSections as OnboardingStepName[];
            updateStep.mutate({ completedSteps, skipExperience: false });
          }}
        />
      );
    case "educations":
      return <EducationForm key={profileFormKey} onComplete={() => updateStep.mutate({ completedSteps: "educations" })} />;
    case "experiences":
      return (
        <ExperienceForm
          key={profileFormKey}
          onComplete={skipExperience => updateStep.mutate({ completedSteps: "experiences", skipExperience })}
        />
      );
    case "projects": {
      const projectStep = data.steps.find(step => step.name === "projects");
      return (
        <ProjectsForm
          key={profileFormKey}
          isRequired={Boolean(projectStep?.required)}
          onComplete={() => updateStep.mutate({ completedSteps: "projects" })}
        />
      );
    }
    case "skills":
      return <SkillsForm key={profileFormKey} onComplete={() => updateStep.mutate({ completedSteps: "skills" })} />;
    case "role":
      return <DesiredRoleForm onComplete={() => updateStep.mutate({ completedSteps: "role" })} />;
    case "whatsapp":
      return <WhatsAppForm onComplete={() => updateStep.mutate({ completedSteps: "whatsapp" })} />;
    case "linkedin":
      return <LinkedInForm onComplete={() => updateStep.mutate({ completedSteps: "linkedin" })} />;
    case "goal":
      return <GoalForm onComplete={() => updateStep.mutate({ completedSteps: "goal" })} />;
    default:
      return null;
  }
}
