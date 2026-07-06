"use client";

import type { OnboardingEducation, OnboardingExperience, OnboardingProject } from "@/features/onboarding/types";
import { create } from "zustand";
import { EMPTY_PROFILE, type ChatEngineState, type ProfileBuilderData, type ProfileChatMessage, type ProfileSection } from "./types";

type ProfileBuilderStore = {
  data: ProfileBuilderData;
  messages: ProfileChatMessage[];
  engine: ChatEngineState;
  activeSection: ProfileSection;
  openSections: Record<ProfileSection, boolean>;
  isThinking: boolean;
  setThinking: (v: boolean) => void;
  setActiveSection: (section: ProfileSection) => void;
  toggleSection: (section: ProfileSection) => void;
  setOpenSection: (section: ProfileSection, open: boolean) => void;
  addMessage: (msg: Omit<ProfileChatMessage, "id" | "timestamp"> & { id?: string }) => void;
  setEngine: (patch: Partial<ChatEngineState>) => void;
  resetEngineDraft: (section: ProfileSection) => void;
  setEducations: (items: OnboardingEducation[]) => void;
  setExperiences: (items: OnboardingExperience[]) => void;
  setProjects: (items: OnboardingProject[]) => void;
  setSkills: (items: string[]) => void;
  markExperienceSkipped: () => void;
  markProjectsSkipped: () => void;
  reset: () => void;
};

const INITIAL_ENGINE: ChatEngineState = {
  section: "education",
  step: "intro",
  draftEducation: {},
  draftExperience: {},
  draftProject: {},
};

export const useProfileBuilderStore = create<ProfileBuilderStore>((set, get) => ({
  data: { ...EMPTY_PROFILE },
  messages: [],
  engine: { ...INITIAL_ENGINE },
  activeSection: "education",
  openSections: { education: true, experience: false, projects: false, skills: false },
  isThinking: false,
  setThinking: isThinking => set({ isThinking }),
  setActiveSection: activeSection => set({ activeSection }),
  toggleSection: section =>
    set(state => ({
      openSections: { ...state.openSections, [section]: !state.openSections[section] },
    })),
  setOpenSection: (section, open) =>
    set(state => ({
      openSections: { ...state.openSections, [section]: open },
    })),
  addMessage: msg =>
    set(state => ({
      messages: [
        ...state.messages,
        {
          id: msg.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date(),
          role: msg.role,
          text: msg.text,
          section: msg.section,
        },
      ],
    })),
  setEngine: patch =>
    set(state => ({
      engine: { ...state.engine, ...patch },
    })),
  resetEngineDraft: section => {
    if (section === "education") set(state => ({ engine: { ...state.engine, draftEducation: {} } }));
    if (section === "experience") set(state => ({ engine: { ...state.engine, draftExperience: {} } }));
    if (section === "projects") set(state => ({ engine: { ...state.engine, draftProject: {} } }));
  },
  setEducations: educations => set(state => ({ data: { ...state.data, educations } })),
  setExperiences: experiences => set(state => ({ data: { ...state.data, experiences } })),
  setProjects: projects => set(state => ({ data: { ...state.data, projects } })),
  setSkills: skills => set(state => ({ data: { ...state.data, skills } })),
  markExperienceSkipped: () => set(state => ({ data: { ...state.data, experienceSkipped: true } })),
  markProjectsSkipped: () => set(state => ({ data: { ...state.data, projectsSkipped: true } })),
  reset: () =>
    set({
      data: { ...EMPTY_PROFILE },
      messages: [],
      engine: { ...INITIAL_ENGINE },
      activeSection: "education",
      openSections: { education: true, experience: false, projects: false, skills: false },
      isThinking: false,
    }),
}));
