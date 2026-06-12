"use client";

import React, { useCallback, useEffect } from "react";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingStep, OnboardingStepName } from "@/features/onboarding/types";
import {
  fetchOnboardingCheckpoints,
  getUserOnboardingState,
  type OnboardingCheckpoints,
  type OnboardingUserState,
} from "@/lib/actions/onboardingActions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

type OnboardingState = {
  steps: OnboardingStep[];
  name: string;
  userState: OnboardingUserState;
  currentStepIndex: number;
  /** Stack of step indices the user actually saw before landing on currentStepIndex. */
  history: number[];
};

const buildSteps = (checkpoints: OnboardingCheckpoints): OnboardingStep[] => [
  { name: "welcome", completed: false, required: true },
  { name: "name", completed: Boolean(checkpoints.preferred_name), required: true },
  {
    name: "resume",
    completed: Boolean(checkpoints.education || checkpoints.experience || checkpoints.project || checkpoints.skill),
    required: true,
  },
  { name: "educations", completed: Boolean(checkpoints.education), required: true },
  { name: "experiences", completed: Boolean(checkpoints.experience), required: false },
  { name: "projects", completed: Boolean(checkpoints.project), required: false },
  { name: "skills", completed: Boolean(checkpoints.skill), required: true },
  { name: "role", completed: Boolean(checkpoints.role), required: true },
  { name: "whatsapp", completed: Boolean(checkpoints.phone_number), required: true },
  { name: "linkedin", completed: Boolean(checkpoints.linkedin_url), required: true },
  { name: "goal", completed: Boolean(checkpoints.goal), required: true },
];

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
  const registerSkipCurrentStep = useOnboardingUIStore(s => s.registerSkipCurrentStep);
  const setCanSkipCurrentStep = useOnboardingUIStore(s => s.setCanSkipCurrentStep);

  const { data, isLoading } = useQuery<OnboardingState | null>({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: async () => {
      const checkpoints = await fetchOnboardingCheckpoints();
      const userState = await getUserOnboardingState(checkpoints);
      if (userState === "COMPLETED") {
        return {
          steps: [],
          name: checkpoints.name ?? "",
          userState,
          currentStepIndex: 0,
          history: [],
        };
      }
      return {
        steps: buildSteps(checkpoints),
        name: checkpoints.name ?? "",
        userState,
        currentStepIndex: 0,
        history: [],
      };
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const updateStep = useMutation<
    OnboardingState,
    unknown,
    { completedSteps: OnboardingStepName | OnboardingStepName[]; skipExperience?: boolean }
  >({
    mutationFn: async ({ completedSteps, skipExperience }) => {
      const current = queryClient.getQueryData<OnboardingState>(ONBOARDING_QUERY_KEY);
      if (!current) throw new Error("No onboarding state cached");
      const updatedSteps = current.steps.map(s => ({ ...s }));
      const currentIndex = current.currentStepIndex;

      if (Array.isArray(completedSteps)) {
        completedSteps.forEach(stepName => {
          const idx = updatedSteps.findIndex(s => s.name === stepName);
          if (idx !== -1) updatedSteps[idx].completed = true;
        });
        const resumeIdx = updatedSteps.findIndex(s => s.name === "resume");
        if (resumeIdx !== -1) updatedSteps[resumeIdx].completed = true;
      } else {
        if (currentIndex >= 0 && currentIndex < updatedSteps.length) {
          updatedSteps[currentIndex].completed = true;
        }
        if (completedSteps === "experiences" && skipExperience) {
          const projectIdx = updatedSteps.findIndex(s => s.name === "projects");
          if (projectIdx !== -1) updatedSteps[projectIdx].required = true;
        }
      }

      const nextIncompleteIdx = updatedSteps.findIndex((step, i) => i > currentIndex && !step.completed);

      const nextStepIndex = nextIncompleteIdx === -1 ? -1 : nextIncompleteIdx;
      // Only record history when we actually advance to another rendered step.
      const nextHistory = nextStepIndex !== -1 && currentIndex >= 0 ? [...current.history, currentIndex] : current.history;

      return {
        ...current,
        steps: updatedSteps,
        currentStepIndex: nextStepIndex,
        history: nextHistory,
      };
    },
    onSuccess: next => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, next);
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
      const nextHistory = nextStepIndex !== -1 && currentIndex >= 0 ? [...current.history, currentIndex] : current.history;

      return {
        ...current,
        currentStepIndex: nextStepIndex,
        history: nextHistory,
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
        updateStep.mutate({ completedSteps: ["resume"] });
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
    const isWelcome = step.name === "welcome";
    const isProjectsRequired = step.name === "projects" && step.required;

    setCanSkipCurrentStep(!isWelcome && !isLastStep && !isProjectsRequired);
    registerSkipCurrentStep(handleSkipCurrentStep);

    return () => {
      registerSkipCurrentStep(null);
      setCanSkipCurrentStep(false);
    };
  }, [data, handleSkipCurrentStep, registerSkipCurrentStep, setCanSkipCurrentStep]);

  const reachedEnd = Boolean(
    data && (data.currentStepIndex >= data.steps.length || data.currentStepIndex === -1 || data.steps.length === 0)
  );

  useEffect(() => {
    if (!reachedEnd) return;
    const timeout = window.setTimeout(() => {
      window.location.href = "/uniboard/resume";
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [reachedEnd]);

  if (isLoading) return <LoadingState />;
  if (!data) return <LoadingState />;
  if (reachedEnd) return <RedirectingState />;

  const currentStep = data.steps[data.currentStepIndex];
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
          onComplete={extractedSections => {
            const completedSteps = (extractedSections.length > 0 ? extractedSections : ["resume"]) as OnboardingStepName[];
            updateStep.mutate({ completedSteps, skipExperience: false });
          }}
        />
      );
    case "educations":
      return <EducationForm onComplete={() => updateStep.mutate({ completedSteps: "educations" })} />;
    case "experiences":
      return <ExperienceForm onComplete={skipExperience => updateStep.mutate({ completedSteps: "experiences", skipExperience })} />;
    case "projects": {
      const projectStep = data.steps.find(s => s.name === "projects");
      return (
        <ProjectsForm isRequired={Boolean(projectStep?.required)} onComplete={() => updateStep.mutate({ completedSteps: "projects" })} />
      );
    }
    case "skills":
      return <SkillsForm onComplete={() => updateStep.mutate({ completedSteps: "skills" })} />;
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
