import type { ResumeData, ResumeEducation, ResumeExperience, ResumeSkill } from '@/types';

const DEFAULT_SUMMARY =
  'Results-driven professional with a proven track record of delivering measurable impact. Skilled in collaboration, problem-solving, and adapting quickly in fast-paced environments.';

const BULLET_APPEND =
  '\n- Delivered measurable outcomes aligned with team goals and stakeholder expectations.';

const DEFAULT_SKILLS = ['Communication', 'Problem Solving', 'Teamwork', 'Microsoft Office'];

export function applyAtsFixes(resume: ResumeData): ResumeData {
  const next: ResumeData = {
    ...resume,
    profile: { ...resume.profile },
    experience: resume.experience.map((e) => ({ ...e })),
    education: resume.education.map((e) => ({ ...e })),
    skills: resume.skills.map((s) => ({ ...s })),
    customSections: resume.customSections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })),
    sectionOrder: [...resume.sectionOrder],
    hiddenSections: resume.hiddenSections ? [...resume.hiddenSections] : undefined,
  };

  if (!next.profile.summary || next.profile.summary.trim().length < 50) {
    const existing = next.profile.summary?.trim() ?? '';
    next.profile.summary = existing
      ? `${existing}\n\n${DEFAULT_SUMMARY}`
      : DEFAULT_SUMMARY;
  }

  if (next.experience.length === 0) {
    const placeholder: ResumeExperience = {
      id: `exp-fix-${Date.now()}`,
      company: 'Company Name',
      role: 'Your Role',
      startDate: '',
      endDate: '',
      current: true,
      description: `Key responsibilities and achievements.${BULLET_APPEND}`,
    };
    next.experience = [placeholder];
  } else {
    next.experience = next.experience.map((exp) => {
      if (exp.description.length >= 20) return exp;
      const trimmed = exp.description.trim();
      return {
        ...exp,
        description: trimmed
          ? `${trimmed}${BULLET_APPEND}`
          : `Describe your impact in this role.${BULLET_APPEND}`,
      };
    });
  }

  if (next.skills.length < 4) {
    const existingNames = new Set(next.skills.map((s) => s.name.toLowerCase()));
    const toAdd: ResumeSkill[] = [];
    for (const name of DEFAULT_SKILLS) {
      if (next.skills.length + toAdd.length >= 4) break;
      if (!existingNames.has(name.toLowerCase())) {
        toAdd.push({ id: `skill-fix-${Date.now()}-${toAdd.length}`, name });
        existingNames.add(name.toLowerCase());
      }
    }
    next.skills = [...next.skills, ...toAdd];
  }

  if (next.education.length === 0) {
    const placeholder: ResumeEducation = {
      id: `edu-fix-${Date.now()}`,
      school: 'University Name',
      degree: 'Degree / Program',
      startDate: '',
      endDate: '',
      description: 'Relevant coursework, honors, or activities.',
    };
    next.education = [placeholder];
  }

  next.lastModified = new Date();
  return next;
}
