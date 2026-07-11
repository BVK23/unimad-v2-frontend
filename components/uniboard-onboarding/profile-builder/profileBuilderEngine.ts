import type { OnboardingEducation, OnboardingExperience, OnboardingProject } from "@/features/onboarding/types";
import {
  formatProfileBuilderValidationError,
  validateProfileBuilderData,
  type ProfileBuilderValidationError,
} from "./profileBuilderEntryValidation";
import type { ChatEngineState, ProfileBuilderData, ProfileSection } from "./types";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export type EngineCallbacks = {
  addAssistant: (text: string, section?: ProfileSection) => void;
  addStatus: (text: string) => void;
  setEngine: (patch: Partial<ChatEngineState>) => void;
  setActiveSection: (section: ProfileSection) => void;
  setOpenSection: (section: ProfileSection, open: boolean) => void;
  setEducations: (items: OnboardingEducation[]) => void;
  setExperiences: (items: OnboardingExperience[]) => void;
  setProjects: (items: OnboardingProject[]) => void;
  setSkills: (items: string[]) => void;
  markExperienceSkipped: () => void;
  markProjectsSkipped: () => void;
  getData: () => ProfileBuilderData;
  getEngine: () => ChatEngineState;
  setThinking: (v: boolean) => void;
};

function parseDescriptions(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const bullets = lines.filter(l => l.startsWith("-")).map(l => l.slice(1).trim());
  if (bullets.length > 0) return bullets;
  return text.trim() ? [text.trim()] : [];
}

function normalizeYearMonth(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^present$/i.test(trimmed)) return "Present";
  const mmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (mmyyyy) return `${mmyyyy[2]}-${mmyyyy[1].padStart(2, "0")}`;
  const yyyymm = trimmed.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (yyyymm) return `${yyyymm[1]}-${yyyymm[2].padStart(2, "0")}`;
  return null;
}

export async function startProfileBuilderChat(cb: EngineCallbacks, preferredName: string) {
  cb.setThinking(true);
  cb.addStatus("Unibot is getting ready…");
  await delay(600);
  cb.setThinking(false);
  cb.addAssistant(
    preferredName
      ? `Hi ${preferredName}! I'll help you build your profile. We'll go through education, experience, projects, and skills. You can also edit anything on the right anytime.`
      : "Hi! I'll help you build your profile. We'll go through education, experience, projects, and skills. You can also edit anything on the right anytime.",
    "education"
  );
  await delay(400);
  cb.setEngine({ section: "education", step: "institution" });
  cb.setActiveSection("education");
  cb.setOpenSection("education", true);
  cb.addAssistant("Let's start with education. Which university or college did you attend?", "education");
}

export async function handleProfileBuilderMessage(cb: EngineCallbacks, rawMessage: string) {
  const message = rawMessage.trim();
  if (!message) return;

  const engine = cb.getEngine();
  const data = cb.getData();

  cb.setThinking(true);
  cb.addStatus("Unibot is thinking…");
  await delay(500);

  if (message.toLowerCase() === "skip" && engine.section === "experience" && engine.step !== "confirm_add") {
    cb.markExperienceSkipped();
    cb.setThinking(false);
    cb.addAssistant("No problem. Freshers often skip full-time experience. We'll cover projects next.", "projects");
    await beginProjects(cb);
    return;
  }

  if (message.toLowerCase() === "skip" && engine.section === "projects") {
    if (data.experiences.length === 0 && !data.experienceSkipped) {
      cb.setThinking(false);
      cb.addAssistant(
        "Since you don't have experience yet, please add at least one project or internship. Tell me about one, or fill it in on the right.",
        "projects"
      );
      return;
    }
    cb.markProjectsSkipped();
    cb.setThinking(false);
    await beginSkills(cb);
    return;
  }

  if (engine.section === "education") {
    await handleEducationMessage(cb, message);
    return;
  }
  if (engine.section === "experience") {
    await handleExperienceMessage(cb, message);
    return;
  }
  if (engine.section === "projects") {
    await handleProjectsMessage(cb, message);
    return;
  }
  if (engine.section === "skills") {
    await handleSkillsMessage(cb, message);
  }
}

async function handleEducationMessage(cb: EngineCallbacks, message: string) {
  const engine = cb.getEngine();
  const draft = { ...engine.draftEducation };

  if (engine.step === "institution") {
    draft.institution = message;
    cb.setEngine({ draftEducation: draft, step: "course" });
    cb.setThinking(false);
    cb.addAssistant("What course or degree did you study?", "education");
    return;
  }
  if (engine.step === "course") {
    draft.course = message;
    cb.setEngine({ draftEducation: draft, step: "startDate" });
    cb.setThinking(false);
    cb.addAssistant("When did you start? (e.g. 09/2021 or 2021-09)", "education");
    return;
  }
  if (engine.step === "startDate") {
    const parsed = normalizeYearMonth(message);
    if (!parsed) {
      cb.setThinking(false);
      cb.addAssistant("Please use a format like 09/2021 or 2021-09.", "education");
      return;
    }
    draft.startDate = parsed;
    cb.setEngine({ draftEducation: draft, step: "endDate" });
    cb.setThinking(false);
    cb.addAssistant("When did you finish? Say Present if you're still studying.", "education");
    return;
  }
  if (engine.step === "endDate") {
    const parsed = normalizeYearMonth(message) ?? (message.toLowerCase() === "present" ? "Present" : null);
    if (!parsed) {
      cb.setThinking(false);
      cb.addAssistant("Please use a date like 06/2025, or say Present.", "education");
      return;
    }
    draft.endDate = parsed;
    cb.setEngine({ draftEducation: draft, step: "courseWork" });
    cb.setThinking(false);
    cb.addAssistant("Any key coursework or subjects? (comma-separated is fine)", "education");
    return;
  }
  if (engine.step === "courseWork") {
    draft.courseWork = message;
    const entry = draft as OnboardingEducation;
    const next = [...cb.getData().educations, entry];
    cb.setEducations(next);
    cb.setEngine({ draftEducation: {}, step: "confirm_add" });
    cb.setThinking(false);
    cb.addAssistant(`Added ${entry.institution}. Want to add another degree? Reply yes or no.`, "education");
    return;
  }
  if (engine.step === "confirm_add") {
    const yes = /^y(es)?/i.test(message);
    cb.setThinking(false);
    if (yes) {
      cb.setEngine({ step: "institution", draftEducation: {} });
      cb.addAssistant("Great. Which university or college was it?", "education");
    } else {
      await beginExperience(cb);
    }
  }
}

async function beginExperience(cb: EngineCallbacks) {
  cb.setEngine({ section: "experience", step: "intro", draftExperience: {} });
  cb.setActiveSection("experience");
  cb.setOpenSection("experience", true);
  cb.addAssistant(
    "Now tell me about your work experience. What company did you work at most recently? (Reply skip if you're a fresher.)",
    "experience"
  );
}

async function handleExperienceMessage(cb: EngineCallbacks, message: string) {
  const engine = cb.getEngine();
  const draft = { ...engine.draftExperience };

  if (engine.step === "intro" || engine.step === "organisation") {
    draft.organisation = message;
    cb.setEngine({ draftExperience: draft, step: "role" });
    cb.setThinking(false);
    cb.addAssistant("What was your role or job title?", "experience");
    return;
  }
  if (engine.step === "role") {
    draft.role = message;
    cb.setEngine({ draftExperience: draft, step: "startDate" });
    cb.setThinking(false);
    cb.addAssistant("When did you start this role? (e.g. 01/2023)", "experience");
    return;
  }
  if (engine.step === "startDate") {
    const parsed = normalizeYearMonth(message);
    if (!parsed) {
      cb.setThinking(false);
      cb.addAssistant("Please use a format like 01/2023.", "experience");
      return;
    }
    draft.startDate = parsed;
    cb.setEngine({ draftExperience: draft, step: "endDate" });
    cb.setThinking(false);
    cb.addAssistant("When did you leave? Say Present if you're still there.", "experience");
    return;
  }
  if (engine.step === "endDate") {
    const parsed = normalizeYearMonth(message) ?? (message.toLowerCase() === "present" ? "Present" : null);
    if (!parsed) {
      cb.setThinking(false);
      cb.addAssistant("Please use a date or say Present.", "experience");
      return;
    }
    draft.endDate = parsed;
    cb.setEngine({ draftExperience: draft, step: "descriptions" });
    cb.setThinking(false);
    cb.addAssistant("What did you do there? Share a few bullet points or a short paragraph.", "experience");
    return;
  }
  if (engine.step === "descriptions") {
    const descriptions = parseDescriptions(message);
    const entry: OnboardingExperience = {
      organisation: draft.organisation ?? "",
      role: draft.role ?? "",
      startDate: draft.startDate ?? "",
      endDate: draft.endDate ?? "",
      descriptions,
    };
    cb.setExperiences([...cb.getData().experiences, entry]);
    cb.setEngine({ draftExperience: {}, step: "confirm_add" });
    cb.setThinking(false);
    cb.addAssistant(`Added ${entry.role} at ${entry.organisation}. Add another role? Reply yes or no.`, "experience");
    return;
  }
  if (engine.step === "confirm_add") {
    const yes = /^y(es)?/i.test(message);
    cb.setThinking(false);
    if (yes) {
      cb.setEngine({ step: "organisation", draftExperience: {} });
      cb.addAssistant("Which company was it?", "experience");
    } else {
      await beginProjects(cb);
    }
  }
}

async function beginProjects(cb: EngineCallbacks) {
  const data = cb.getData();
  const needsProject = data.experiences.length === 0 || data.experienceSkipped;
  cb.setEngine({ section: "projects", step: "intro", draftProject: {} });
  cb.setActiveSection("projects");
  cb.setOpenSection("projects", true);
  cb.addAssistant(
    needsProject
      ? "Tell me about a project or internship. What was it called? (Required if you skipped experience.)"
      : "Any projects worth highlighting? What was the project name? (Reply skip to move on.)",
    "projects"
  );
}

async function handleProjectsMessage(cb: EngineCallbacks, message: string) {
  const engine = cb.getEngine();
  const draft = { ...engine.draftProject };

  if (engine.step === "intro" || engine.step === "name") {
    draft.name = message;
    cb.setEngine({ draftProject: draft, step: "descriptions" });
    cb.setThinking(false);
    cb.addAssistant("What did you build or achieve? A short description is enough.", "projects");
    return;
  }
  if (engine.step === "descriptions") {
    const descriptions = parseDescriptions(message);
    const entry: OnboardingProject = {
      name: draft.name ?? "",
      descriptions,
      link: draft.link,
    };
    cb.setProjects([...cb.getData().projects, entry]);
    cb.setEngine({ draftProject: {}, step: "confirm_add" });
    cb.setThinking(false);
    cb.addAssistant(`Added ${entry.name}. Add another project? Reply yes or no.`, "projects");
    return;
  }
  if (engine.step === "confirm_add") {
    const yes = /^y(es)?/i.test(message);
    cb.setThinking(false);
    if (yes) {
      cb.setEngine({ step: "name", draftProject: {} });
      cb.addAssistant("What's the project name?", "projects");
    } else {
      await beginSkills(cb);
    }
  }
}

async function beginSkills(cb: EngineCallbacks) {
  cb.setEngine({ section: "skills", step: "collect" });
  cb.setActiveSection("skills");
  cb.setOpenSection("skills", true);
  cb.setThinking(false);
  cb.addAssistant(
    "Almost done! List your top skills, comma-separated (e.g. Python, SQL, Product Marketing). I'll suggest more on the right too.",
    "skills"
  );
}

async function handleSkillsMessage(cb: EngineCallbacks, message: string) {
  const parts = message
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const merged = [...new Set([...cb.getData().skills, ...parts])];
  cb.setSkills(merged);
  cb.setEngine({ step: "done" });
  cb.setThinking(false);
  cb.addAssistant(
    merged.length >= 3
      ? `Great, I've added ${merged.length} skills. Review everything on the right, then hit Continue when you're ready.`
      : `Added ${parts.length} skill(s). Pick a few more on the right or tell me more (need at least 3).`,
    "skills"
  );
}

export function isProfileBuilderComplete(data: ProfileBuilderData): boolean {
  return profileBuilderValidationError(data) === null;
}

export function profileBuilderValidationErrors(data: ProfileBuilderData): ProfileBuilderValidationError[] {
  return validateProfileBuilderData(data);
}

export function profileBuilderValidationError(data: ProfileBuilderData): string | null {
  const errors = validateProfileBuilderData(data);
  if (errors.length === 0) return null;
  return formatProfileBuilderValidationError(errors[0]);
}
