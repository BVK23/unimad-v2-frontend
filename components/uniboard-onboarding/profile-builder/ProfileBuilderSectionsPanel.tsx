"use client";

import { useEffect, useState } from "react";
import MonthYearInput from "@/components/onboarding/shared/MonthYearInput";
import type { OnboardingEducation, OnboardingExperience, OnboardingProject } from "@/features/onboarding/types";
import { getSuggestions } from "@/lib/actions/onboardingActions";
import { ChevronDown, Plus, X } from "lucide-react";
import { CollapsibleEntry, Field, formatDateRange, inputClass } from "./CollapsibleEntry";
import SuggestionPills from "./SuggestionPills";
import type { ProfileSection } from "./types";
import { useOnboardingSuggestionsStore } from "./useOnboardingSuggestionsStore";
import { useProfileBuilderStore } from "./useProfileBuilderStore";
import { useProfileSuggestions } from "./useProfileSuggestions";

const SECTION_META: Record<ProfileSection, { title: string; minLabel?: string }> = {
  education: { title: "Education", minLabel: "Min 1" },
  experience: { title: "Experience", minLabel: "Min 1 or skip" },
  projects: { title: "Projects", minLabel: "Skip if experienced" },
  skills: { title: "Skills", minLabel: "Min 3" },
};

type OpenKey = string | null;

export default function ProfileBuilderSectionsPanel() {
  const openSections = useProfileBuilderStore(s => s.openSections);
  const activeSection = useProfileBuilderStore(s => s.activeSection);
  const toggleSection = useProfileBuilderStore(s => s.toggleSection);
  const data = useProfileBuilderStore(s => s.data);

  const sections: ProfileSection[] = ["education", "experience", "projects", "skills"];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 border-b border-[rgba(12,15,26,0.06)] bg-white/95 px-5 py-4 backdrop-blur-sm">
        <p className="text-sm font-semibold text-[#0C0F1A]">Your profile</p>
        <p className="text-xs text-[#4A5568]">Edit any section while you chat</p>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {sections.map(section => {
          const open = openSections[section];
          const isActive = activeSection === section;
          const count = sectionCount(data, section);
          return (
            <div
              key={section}
              className={`overflow-hidden rounded-[14px] border transition-colors ${
                isActive ? "border-[#346DE0]/40 ring-1 ring-[#346DE0]/20" : "border-[rgba(12,15,26,0.08)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F8F9FB]"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0C0F1A]">{SECTION_META[section].title}</p>
                  <p className="text-[11px] text-[#A9B4C2]">
                    {SECTION_META[section].minLabel}
                    {count > 0 ? ` · ${count} added` : ""}
                  </p>
                </div>
                <ChevronDown size={18} className={`shrink-0 text-[#4A5568] transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <div className="border-t border-[rgba(12,15,26,0.06)] px-4 py-3">
                  {section === "education" ? <EducationEditor /> : null}
                  {section === "experience" ? <ExperienceEditor /> : null}
                  {section === "projects" ? <ProjectsEditor /> : null}
                  {section === "skills" ? <SkillsEditor /> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sectionCount(data: ReturnType<typeof useProfileBuilderStore.getState>["data"], section: ProfileSection): number {
  if (section === "education") return data.educations.length;
  if (section === "experience") return data.experiences.length;
  if (section === "projects") return data.projects.length;
  if (section === "skills") return data.skills.length;
  return 0;
}

function EducationEditor() {
  const educations = useProfileBuilderStore(s => s.data.educations);
  const setEducations = useProfileBuilderStore(s => s.setEducations);
  const [openKey, setOpenKey] = useState<OpenKey>(null);
  const [draft, setDraft] = useState<OnboardingEducation>(emptyEducation());

  const { suggestions, loading } = useProfileSuggestions("onboarding_education", draft.course);

  useLiveDraftSync(openKey, draft);

  const openNew = () => {
    const next = [...educations, emptyEducation()];
    setEducations(next);
    const idx = next.length - 1;
    setDraft({ ...next[idx] });
    setOpenKey(`edu-${idx}`);
  };

  const openEdit = (idx: number) => {
    setDraft({ ...educations[idx] });
    setOpenKey(`edu-${idx}`);
  };

  const remove = (idx: number) => {
    setEducations(educations.filter((_, i) => i !== idx));
    if (openKey === `edu-${idx}`) setOpenKey(null);
  };

  return (
    <EditorShell>
      {educations.map((edu, idx) => (
        <CollapsibleEntry
          key={`edu-${idx}`}
          title={
            edu.course.trim() || edu.institution.trim() ? `${edu.course || "Course"} · ${edu.institution || "University"}` : "New education"
          }
          subtitle={[formatDateRange(edu.startDate, edu.endDate), edu.courseWork].filter(Boolean).join(" · ")}
          open={openKey === `edu-${idx}`}
          onToggle={() => (openKey === `edu-${idx}` ? setOpenKey(null) : openEdit(idx))}
          onRemove={() => remove(idx)}
        >
          <EducationForm draft={draft} setDraft={setDraft} suggestions={suggestions} suggestionsLoading={loading} />
        </CollapsibleEntry>
      ))}

      <AddButton onClick={openNew} label="Add education" />
    </EditorShell>
  );
}

function EducationForm({
  draft,
  setDraft,
  suggestions,
  suggestionsLoading,
}: {
  draft: OnboardingEducation;
  setDraft: (v: OnboardingEducation) => void;
  suggestions: string[];
  suggestionsLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="University">
        <input
          className={inputClass}
          value={draft.institution}
          onChange={e => setDraft({ ...draft, institution: e.target.value })}
          placeholder="University name"
        />
      </Field>
      <Field label="Course">
        <input
          className={inputClass}
          value={draft.course}
          onChange={e => setDraft({ ...draft, course: e.target.value })}
          placeholder="Degree or course"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Start">
          <MonthYearInput value={draft.startDate} onChange={v => setDraft({ ...draft, startDate: v })} placeholder="Start" />
        </Field>
        <Field label="End">
          <MonthYearInput value={draft.endDate} onChange={v => setDraft({ ...draft, endDate: v })} placeholder="End" showPresentOption />
        </Field>
      </div>
      <Field label="Coursework">
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={draft.courseWork}
          onChange={e => setDraft({ ...draft, courseWork: e.target.value })}
          placeholder="Key subjects or coursework"
        />
        <SuggestionPills
          suggestions={suggestions}
          loading={suggestionsLoading}
          active={draft.course.trim().length >= 2}
          value={draft.courseWork}
          onChange={v => setDraft({ ...draft, courseWork: v })}
          mode="comma"
        />
      </Field>
    </div>
  );
}

function ExperienceEditor() {
  const experiences = useProfileBuilderStore(s => s.data.experiences);
  const setExperiences = useProfileBuilderStore(s => s.setExperiences);
  const markExperienceSkipped = useProfileBuilderStore(s => s.markExperienceSkipped);
  const experienceSkipped = useProfileBuilderStore(s => s.data.experienceSkipped);
  const [openKey, setOpenKey] = useState<OpenKey>(null);
  const [draft, setDraft] = useState(emptyExperience());

  const { suggestions, loading } = useProfileSuggestions("onboarding_experience", draft.role);

  useLiveDraftSync(openKey, draft);

  const openNew = () => {
    const next = [...experiences, toExperienceEntry(emptyExperience())];
    setExperiences(next);
    const idx = next.length - 1;
    setDraft(emptyExperience());
    setOpenKey(`exp-${idx}`);
  };

  const openEdit = (idx: number) => {
    const exp = experiences[idx];
    setDraft({
      organisation: exp.organisation,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      descriptions: exp.descriptions.join("\n"),
    });
    setOpenKey(`exp-${idx}`);
  };

  return (
    <EditorShell>
      {experienceSkipped ? <p className="text-xs text-[#4A5568]">Marked as fresher (no experience).</p> : null}
      {experiences.map((exp, idx) => (
        <CollapsibleEntry
          key={`exp-${idx}`}
          title={exp.role.trim() || exp.organisation.trim() ? `${exp.role || "Role"} · ${exp.organisation || "Company"}` : "New experience"}
          subtitle={[formatDateRange(exp.startDate, exp.endDate), exp.descriptions[0]].filter(Boolean).join(" · ")}
          open={openKey === `exp-${idx}`}
          onToggle={() => (openKey === `exp-${idx}` ? setOpenKey(null) : openEdit(idx))}
          onRemove={() => {
            setExperiences(experiences.filter((_, i) => i !== idx));
            if (openKey === `exp-${idx}`) setOpenKey(null);
          }}
        >
          <ExperienceForm draft={draft} setDraft={setDraft} suggestions={suggestions} suggestionsLoading={loading} />
        </CollapsibleEntry>
      ))}

      <div className="flex flex-wrap gap-2">
        <AddButton onClick={openNew} label="Add experience" />
        <button
          type="button"
          onClick={markExperienceSkipped}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#4A5568] underline hover:text-[#346DE0]"
        >
          {experienceSkipped ? "Undo fresher" : "I'm a fresher"}
        </button>
      </div>
    </EditorShell>
  );
}

function ExperienceForm({
  draft,
  setDraft,
  suggestions,
  suggestionsLoading,
}: {
  draft: ReturnType<typeof emptyExperience>;
  setDraft: (v: ReturnType<typeof emptyExperience>) => void;
  suggestions: string[];
  suggestionsLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Company">
        <input
          className={inputClass}
          value={draft.organisation}
          onChange={e => setDraft({ ...draft, organisation: e.target.value })}
          placeholder="Company name"
        />
      </Field>
      <Field label="Role">
        <input
          className={inputClass}
          value={draft.role}
          onChange={e => setDraft({ ...draft, role: e.target.value })}
          placeholder="Job title"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Start">
          <MonthYearInput value={draft.startDate} onChange={v => setDraft({ ...draft, startDate: v })} />
        </Field>
        <Field label="End">
          <MonthYearInput value={draft.endDate} onChange={v => setDraft({ ...draft, endDate: v })} showPresentOption />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={draft.descriptions}
          onChange={e => setDraft({ ...draft, descriptions: e.target.value })}
          placeholder="What you did (one point per line)"
        />
        <SuggestionPills
          suggestions={suggestions}
          loading={suggestionsLoading}
          active={draft.role.trim().length >= 2}
          value={draft.descriptions}
          onChange={v => setDraft({ ...draft, descriptions: v })}
          mode="bullet"
        />
      </Field>
    </div>
  );
}

function ProjectsEditor() {
  const projects = useProfileBuilderStore(s => s.data.projects);
  const setProjects = useProfileBuilderStore(s => s.setProjects);
  const markProjectsSkipped = useProfileBuilderStore(s => s.markProjectsSkipped);
  const experiences = useProfileBuilderStore(s => s.data.experiences);
  const experienceSkipped = useProfileBuilderStore(s => s.data.experienceSkipped);
  const projectsSkipped = useProfileBuilderStore(s => s.data.projectsSkipped);
  const needsProject = experiences.length === 0 || experienceSkipped;
  const [openKey, setOpenKey] = useState<OpenKey>(null);
  const [draft, setDraft] = useState(emptyProject());

  const { suggestions, loading } = useProfileSuggestions("onboarding_project", draft.name);

  useLiveDraftSync(openKey, draft);

  const openNew = () => {
    const next = [...projects, toProjectEntry(emptyProject())];
    setProjects(next);
    const idx = next.length - 1;
    setDraft(emptyProject());
    setOpenKey(`proj-${idx}`);
  };

  const openEdit = (idx: number) => {
    const proj = projects[idx];
    setDraft({ name: proj.name, link: proj.link ?? "", descriptions: proj.descriptions.join("\n") });
    setOpenKey(`proj-${idx}`);
  };

  return (
    <EditorShell>
      {projectsSkipped && !needsProject ? (
        <p className="text-xs text-[#4A5568]">Projects skipped. Add one anytime if you change your mind.</p>
      ) : null}
      {projects.map((proj, idx) => (
        <CollapsibleEntry
          key={`proj-${idx}`}
          title={proj.name.trim() || "New project"}
          subtitle={proj.descriptions[0]}
          open={openKey === `proj-${idx}`}
          onToggle={() => (openKey === `proj-${idx}` ? setOpenKey(null) : openEdit(idx))}
          onRemove={() => {
            setProjects(projects.filter((_, i) => i !== idx));
            if (openKey === `proj-${idx}`) setOpenKey(null);
          }}
        >
          <ProjectForm draft={draft} setDraft={setDraft} suggestions={suggestions} suggestionsLoading={loading} />
        </CollapsibleEntry>
      ))}

      <div className="flex flex-wrap gap-2">
        <AddButton onClick={openNew} label="Add project" />
        {!needsProject ? (
          <button
            type="button"
            onClick={markProjectsSkipped}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#4A5568] underline hover:text-[#346DE0]"
          >
            Skip projects
          </button>
        ) : (
          <p className="self-center text-xs text-[#A9B4C2]">Add at least one project (required for freshers).</p>
        )}
      </div>
    </EditorShell>
  );
}

function ProjectForm({
  draft,
  setDraft,
  suggestions,
  suggestionsLoading,
}: {
  draft: ReturnType<typeof emptyProject>;
  setDraft: (v: ReturnType<typeof emptyProject>) => void;
  suggestions: string[];
  suggestionsLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Project name">
        <input
          className={inputClass}
          value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          placeholder="Project or internship"
        />
      </Field>
      <Field label="Link (optional)">
        <input
          className={inputClass}
          value={draft.link}
          onChange={e => setDraft({ ...draft, link: e.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={draft.descriptions}
          onChange={e => setDraft({ ...draft, descriptions: e.target.value })}
          placeholder="What you built or learned"
        />
        <SuggestionPills
          suggestions={suggestions}
          loading={suggestionsLoading}
          active={draft.name.trim().length >= 2}
          value={draft.descriptions}
          onChange={v => setDraft({ ...draft, descriptions: v })}
          mode="bullet"
        />
      </Field>
    </div>
  );
}

function SkillsEditor() {
  const skills = useProfileBuilderStore(s => s.data.skills);
  const setSkills = useProfileBuilderStore(s => s.setSkills);
  const educations = useProfileBuilderStore(s => s.data.educations);
  const experiences = useProfileBuilderStore(s => s.data.experiences);
  const getCached = useOnboardingSuggestionsStore(s => s.getCached);
  const setCached = useOnboardingSuggestionsStore(s => s.setCached);
  const [manual, setManual] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const profileKey = [
    educations.map(e => `${e.course}@${e.institution}`).join("|"),
    experiences.map(e => `${e.role}@${e.organisation}`).join("|"),
  ].join("::");

  useEffect(() => {
    if (!profileKey.trim()) return;

    const cached = getCached("skill", profileKey);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getSuggestions("onboarding_skill");
        const data = res.data ?? [];
        if (!cancelled) {
          setSuggestions(data);
          if (data.length) setCached("skill", profileKey, data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileKey, getCached, setCached]);

  const toggle = (skill: string) => {
    setSkills(skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill]);
  };

  const addManual = () => {
    const t = manual.trim();
    if (!t || skills.includes(t)) return;
    setSkills([...skills, t]);
    setManual("");
  };

  return (
    <EditorShell>
      <div className="flex flex-wrap gap-1.5">
        {skills.map(skill => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-[#F0F6FE] px-2.5 py-1 text-xs text-[#346DE0]">
            {skill}
            <button type="button" onClick={() => toggle(skill)} aria-label={`Remove ${skill}`}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <Field label="Add skill">
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addManual()}
            placeholder="Type a skill"
          />
          <button type="button" onClick={addManual} className="shrink-0 rounded-lg bg-[#346DE0] px-3 text-xs font-medium text-white">
            Add
          </button>
        </div>
      </Field>
      {loading ? <p className="text-xs text-[#A9B4C2]">Loading suggestions…</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 16).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              skills.includes(s)
                ? "bg-[#346DE0] text-white"
                : "bg-[#F8F9FB] text-[#4A5568] ring-1 ring-[rgba(12,15,26,0.08)] hover:bg-[#F0F6FE]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </EditorShell>
  );
}

function EditorShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

/** Push open draft edits into the profile store as the user types. */
function useLiveDraftSync(openKey: OpenKey, draft: unknown) {
  useEffect(() => {
    if (!openKey || openKey === "__new__") return;
    const sep = openKey.indexOf("-");
    if (sep < 0) return;
    const idx = Number(openKey.slice(sep + 1));
    const key = openKey.slice(0, sep);
    if (!Number.isFinite(idx) || idx < 0) return;

    useProfileBuilderStore.setState(state => {
      if (key === "edu") {
        const educations = [...state.data.educations];
        if (idx >= educations.length) return state;
        educations[idx] = draft as OnboardingEducation;
        return { data: { ...state.data, educations } };
      }
      if (key === "exp") {
        const experiences = [...state.data.experiences];
        if (idx >= experiences.length) return state;
        experiences[idx] = toExperienceEntry(draft as ReturnType<typeof emptyExperience>);
        return { data: { ...state.data, experiences } };
      }
      if (key === "proj") {
        const projects = [...state.data.projects];
        if (idx >= projects.length) return state;
        projects[idx] = toProjectEntry(draft as ReturnType<typeof emptyProject>);
        return { data: { ...state.data, projects } };
      }
      return state;
    });
  }, [draft, openKey]);
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#346DE0]/40 px-3 py-2 text-xs font-medium text-[#346DE0] hover:bg-[#F0F6FE]"
    >
      <Plus size={14} />
      {label}
    </button>
  );
}

function emptyEducation(): OnboardingEducation {
  return { institution: "", course: "", startDate: "", endDate: "", courseWork: "" };
}

function emptyExperience() {
  return { organisation: "", role: "", startDate: "", endDate: "", descriptions: "" };
}

function emptyProject() {
  return { name: "", link: "", descriptions: "" };
}

function toExperienceEntry(draft: ReturnType<typeof emptyExperience>): OnboardingExperience {
  const descriptions = draft.descriptions
    .split(/\r?\n/)
    .map(l => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
  return { organisation: draft.organisation, role: draft.role, startDate: draft.startDate, endDate: draft.endDate, descriptions };
}

function toProjectEntry(draft: ReturnType<typeof emptyProject>): OnboardingProject {
  const descriptions = draft.descriptions
    .split(/\r?\n/)
    .map(l => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
  return { name: draft.name, link: draft.link || undefined, descriptions };
}
