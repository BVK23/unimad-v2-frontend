import { create } from "zustand";
import type {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeProject,
  ResumeCertification,
  ResumeSkill,
  CustomSection,
  CustomSectionItem,
} from "../../../../types";

interface ResumeStoreState {
  resumeData: Record<string, ResumeData>;

  // Actions
  setAllResumes: (resumes: ResumeData[]) => void;
  setResumeData: (resumeId: string, data: ResumeData) => void;
  getResumeData: (resumeId: string) => ResumeData | undefined;

  // Field Updates
  updateResumeField: <K extends keyof ResumeData>(resumeId: string, field: K, value: ResumeData[K]) => void;

  // List updates (Add/Remove)
  addSectionItem: (resumeId: string, sectionKey: "experience" | "education" | "projects" | "certifications" | "skills", item: any) => void;
  removeSectionItem: (
    resumeId: string,
    sectionKey: "experience" | "education" | "projects" | "certifications" | "skills",
    itemId: string
  ) => void;

  // Item specific field updates
  updateSectionItem: (
    resumeId: string,
    sectionKey: "experience" | "education" | "projects" | "certifications" | "skills",
    itemId: string,
    value: any // Partial item
  ) => void;

  // Custom Sections
  addCustomSection: (resumeId: string, section: CustomSection) => void;
  removeCustomSection: (resumeId: string, sectionId: string) => void;
  updateCustomSectionTitle: (resumeId: string, sectionId: string, title: string) => void;
  addCustomSectionItem: (resumeId: string, sectionId: string, item: CustomSectionItem) => void;
  removeCustomSectionItem: (resumeId: string, sectionId: string, itemId: string) => void;
  updateCustomSectionItem: (resumeId: string, sectionId: string, itemId: string, value: Partial<CustomSectionItem>) => void;
}

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  resumeData: {},

  setAllResumes: resumes => {
    const dataMap: Record<string, ResumeData> = {};
    resumes.forEach(r => {
      dataMap[r.id] = r;
    });
    set({ resumeData: dataMap });
  },

  setResumeData: (resumeId, data) =>
    set(state => ({
      resumeData: { ...state.resumeData, [resumeId]: data },
    })),

  getResumeData: resumeId => get().resumeData[resumeId],

  updateResumeField: (resumeId, field, value) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: { ...resume, [field]: value },
        },
      };
    }),

  addSectionItem: (resumeId, sectionKey, item) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            [sectionKey]: [...(resume[sectionKey] as any[]), item],
          },
        },
      };
    }),

  removeSectionItem: (resumeId, sectionKey, itemId) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            [sectionKey]: (resume[sectionKey] as any[]).filter(i => i.id !== itemId),
          },
        },
      };
    }),

  updateSectionItem: (resumeId, sectionKey, itemId, value) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            [sectionKey]: (resume[sectionKey] as any[]).map(item => (item.id === itemId ? { ...item, ...value } : item)),
          },
        },
      };
    }),

  // --- Custom Sections ---

  addCustomSection: (resumeId, section) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: [...resume.customSections, section],
            sectionOrder: [...resume.sectionOrder, { id: section.id }],
          },
        },
      };
    }),

  removeCustomSection: (resumeId, sectionId) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: resume.customSections.filter(s => s.id !== sectionId),
            sectionOrder: resume.sectionOrder.filter(s => s.id !== sectionId),
          },
        },
      };
    }),

  updateCustomSectionTitle: (resumeId, sectionId, title) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: resume.customSections.map(s => (s.id === sectionId ? { ...s, title } : s)),
          },
        },
      };
    }),

  addCustomSectionItem: (resumeId, sectionId, item) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: resume.customSections.map(s => (s.id === sectionId ? { ...s, items: [...s.items, item] } : s)),
          },
        },
      };
    }),

  removeCustomSectionItem: (resumeId, sectionId, itemId) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: resume.customSections.map(s =>
              s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
            ),
          },
        },
      };
    }),

  updateCustomSectionItem: (resumeId, sectionId, itemId, value) =>
    set(state => {
      const resume = state.resumeData[resumeId];
      if (!resume) return state;
      return {
        resumeData: {
          ...state.resumeData,
          [resumeId]: {
            ...resume,
            customSections: resume.customSections.map(s => {
              if (s.id !== sectionId) return s;
              return {
                ...s,
                items: s.items.map(item => (item.id === itemId ? { ...item, ...value } : item)),
              };
            }),
          },
        },
      };
    }),
}));
