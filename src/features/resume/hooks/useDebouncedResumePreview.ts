import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "@/types";

const PROFILE_DEBOUNCE_MS = 750;
const ITEM_DEBOUNCE_MS = 750;

type ResumeSliceRefs = {
  id: string;
  title: string;
  templateId: ResumeData["templateId"];
  skills: ResumeData["skills"];
  sectionOrder: ResumeData["sectionOrder"];
  profile: ResumeData["profile"];
  experience: ResumeData["experience"];
  education: ResumeData["education"];
  projects: ResumeData["projects"];
  certifications: ResumeData["certifications"];
  customSections: ResumeData["customSections"];
  educationLeftColumn?: boolean;
};

type ResumeSliceSignatures = {
  skills: string;
  sectionOrder: string;
  profile: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
  customSections: string;
};

function clearTimer(timerRef: { current: ReturnType<typeof setTimeout> | null }) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function toSignature(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Mirrors the legacy `unimadai-frontendapp` behavior:
 * - `profile` updates are debounced at 300ms
 * - `experience`, `education`, `projects`, `certifications`, `customSections` are debounced at 750ms
 * - `skills`, `sectionOrder`, `templateId`, `title` update immediately
 *
 * This hook only debounces what gets passed to the PDF preview renderer.
 */
export function useDebouncedResumePreview(resume: ResumeData) {
  const [resumeForPreview, setResumeForPreview] = useState<ResumeData>(resume);

  const latestResumeRef = useRef<ResumeData>(resume);
  const sliceRefs = useRef<ResumeSliceRefs>({
    id: resume.id,
    title: resume.title,
    templateId: resume.templateId,
    skills: resume.skills,
    sectionOrder: resume.sectionOrder,
    profile: resume.profile,
    experience: resume.experience,
    education: resume.education,
    projects: resume.projects,
    certifications: resume.certifications,
    customSections: resume.customSections,
    educationLeftColumn: resume.educationLeftColumn,
  });
  const signatureRefs = useRef<ResumeSliceSignatures>({
    skills: toSignature(resume.skills),
    sectionOrder: toSignature(resume.sectionOrder),
    profile: toSignature(resume.profile),
    experience: toSignature(resume.experience),
    education: toSignature(resume.education),
    projects: toSignature(resume.projects),
    certifications: toSignature(resume.certifications),
    customSections: toSignature(resume.customSections),
  });

  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const immediateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const experienceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const educationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const certificationsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customSectionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestResumeRef.current = resume;
  }, [resume]);

  useEffect(() => {
    const prev = sliceRefs.current;

    // If we’re editing a different resume, clear timers and sync immediately.
    if (prev.id !== resume.id) {
      clearTimer(profileTimerRef);
      clearTimer(experienceTimerRef);
      clearTimer(educationTimerRef);
      clearTimer(projectsTimerRef);
      clearTimer(certificationsTimerRef);
      clearTimer(customSectionsTimerRef);

      sliceRefs.current = {
        id: resume.id,
        title: resume.title,
        templateId: resume.templateId,
        skills: resume.skills,
        sectionOrder: resume.sectionOrder,
        profile: resume.profile,
        experience: resume.experience,
        education: resume.education,
        projects: resume.projects,
        certifications: resume.certifications,
        customSections: resume.customSections,
        educationLeftColumn: resume.educationLeftColumn,
      };
      signatureRefs.current = {
        skills: toSignature(resume.skills),
        sectionOrder: toSignature(resume.sectionOrder),
        profile: toSignature(resume.profile),
        experience: toSignature(resume.experience),
        education: toSignature(resume.education),
        projects: toSignature(resume.projects),
        certifications: toSignature(resume.certifications),
        customSections: toSignature(resume.customSections),
      };

      return;
    }

    const signatures = signatureRefs.current;
    let didImmediateUpdate = false;
    const immediatePatch: Partial<ResumeData> = {};

    if (prev.title !== resume.title) {
      immediatePatch.title = resume.title;
      prev.title = resume.title;
      didImmediateUpdate = true;
    }

    if (prev.templateId !== resume.templateId) {
      immediatePatch.templateId = resume.templateId;
      prev.templateId = resume.templateId;
      didImmediateUpdate = true;
    }

    if (prev.educationLeftColumn !== resume.educationLeftColumn) {
      immediatePatch.educationLeftColumn = resume.educationLeftColumn;
      prev.educationLeftColumn = resume.educationLeftColumn;
      didImmediateUpdate = true;
    }

    const nextSkillsSignature = toSignature(resume.skills);
    if (signatures.skills !== nextSkillsSignature) {
      signatures.skills = nextSkillsSignature;
      immediatePatch.skills = resume.skills;
      prev.skills = resume.skills;
      didImmediateUpdate = true;
    }

    const nextSectionOrderSignature = toSignature(resume.sectionOrder);
    if (signatures.sectionOrder !== nextSectionOrderSignature) {
      signatures.sectionOrder = nextSectionOrderSignature;
      immediatePatch.sectionOrder = resume.sectionOrder;
      prev.sectionOrder = resume.sectionOrder;
      didImmediateUpdate = true;
    }

    if (didImmediateUpdate) {
      clearTimer(immediateTimerRef);
      immediateTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          return { ...current, ...immediatePatch };
        });
      }, 0);
    }

    // --- Debounced slices ---
    const nextProfileSignature = toSignature(resume.profile);
    if (signatures.profile !== nextProfileSignature) {
      signatures.profile = nextProfileSignature;
      prev.profile = resume.profile;
      clearTimer(profileTimerRef);

      profileTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, profile: latest.profile };
        });
      }, PROFILE_DEBOUNCE_MS);
    }

    const nextExperienceSignature = toSignature(resume.experience);
    if (signatures.experience !== nextExperienceSignature) {
      signatures.experience = nextExperienceSignature;
      prev.experience = resume.experience;
      clearTimer(experienceTimerRef);

      experienceTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, experience: latest.experience };
        });
      }, ITEM_DEBOUNCE_MS);
    }

    const nextEducationSignature = toSignature(resume.education);
    if (signatures.education !== nextEducationSignature) {
      signatures.education = nextEducationSignature;
      prev.education = resume.education;
      clearTimer(educationTimerRef);

      educationTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, education: latest.education };
        });
      }, ITEM_DEBOUNCE_MS);
    }

    const nextProjectsSignature = toSignature(resume.projects);
    if (signatures.projects !== nextProjectsSignature) {
      signatures.projects = nextProjectsSignature;
      prev.projects = resume.projects;
      clearTimer(projectsTimerRef);

      projectsTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, projects: latest.projects };
        });
      }, ITEM_DEBOUNCE_MS);
    }

    const nextCertificationsSignature = toSignature(resume.certifications);
    if (signatures.certifications !== nextCertificationsSignature) {
      signatures.certifications = nextCertificationsSignature;
      prev.certifications = resume.certifications;
      clearTimer(certificationsTimerRef);

      certificationsTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, certifications: latest.certifications };
        });
      }, ITEM_DEBOUNCE_MS);
    }

    const nextCustomSectionsSignature = toSignature(resume.customSections);
    if (signatures.customSections !== nextCustomSectionsSignature) {
      signatures.customSections = nextCustomSectionsSignature;
      prev.customSections = resume.customSections;
      clearTimer(customSectionsTimerRef);

      customSectionsTimerRef.current = setTimeout(() => {
        setResumeForPreview(current => {
          if (!current) return current;
          const latest = latestResumeRef.current;
          if (current.id !== latest.id) return current;
          return { ...current, customSections: latest.customSections };
        });
      }, ITEM_DEBOUNCE_MS);
    }
  }, [resume]);

  useEffect(() => {
    return () => {
      clearTimer(profileTimerRef);
      clearTimer(immediateTimerRef);
      clearTimer(experienceTimerRef);
      clearTimer(educationTimerRef);
      clearTimer(projectsTimerRef);
      clearTimer(certificationsTimerRef);
      clearTimer(customSectionsTimerRef);
    };
  }, []);

  return resumeForPreview;
}
