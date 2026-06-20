/**
 * Resume data mappers – convert between Django JSON (backend DTO) and
 * the frontend ResumeData model used by the editor & preview.
 *
 * Usage:
 *   import { mapBackendResumeToFrontend, mapFrontendResumeToBackend } from '@/features/resume/api/mappers';
 */
import { normalizeResumeMonthStorage } from "@/utils/resumeMonthDate";
import type {
  ResumeData,
  ResumeTemplateId,
  ResumeProfile,
  ResumeExperience,
  ResumeEducation,
  ResumeSkill,
  ResumeProject,
  ResumeCertification,
  CustomSection,
  CustomSectionItem,
  SectionOrderItem,
} from "../../../../types";

export type ResumeAdkStateDeltaPayload = {
  active_context: "resume";
  current_resume: string | null;
  resume_data: Record<string, Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// Template ID mapping
// ---------------------------------------------------------------------------

const TEMPLATE_BACKEND_TO_FRONTEND: Record<string, ResumeTemplateId> = {
  MODERN: "modern",
  CLASSIC: "classic",
  MINIMAL: "minimal",
  US: "us",
  CANADA: "canada",
  BASIC: "basic",
  IRELAND: "ireland",
  AUS: "aus",
  NEXTGEN: "nextgen",
  NEXTGEN_RESUME: "nextgen",
  PROFESSIONALS: "professional",
  PROFESSIONAL: "professional",
  SLATEPRO: "slatepro",
  SLATE_PRO: "slatepro",
  PRIMESLATE: "primeslate",
  PRIME_SLATE: "primeslate",
};

/** Backend template string → normalized key (handles "NextGen Resume" → NEXTGEN_RESUME) */
function normalizeTemplateBackendKey(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "_");
}

const TEMPLATE_FRONTEND_TO_BACKEND: Record<ResumeTemplateId, string> = {
  modern: "MODERN",
  classic: "CLASSIC",
  minimal: "MINIMAL",
  us: "US",
  canada: "CANADA",
  basic: "BASIC",
  ireland: "IRELAND",
  aus: "AUS",
  nextgen: "NEXTGEN_RESUME",
  professional: "PROFESSIONALS",
  slatepro: "SlatePro",
  primeslate: "PrimeSlate",
};

function templateBackendToFrontend(raw: string | undefined): ResumeTemplateId {
  if (!raw) return "modern";
  const trimmed = String(raw).trim();
  const normalized = normalizeTemplateBackendKey(trimmed);
  return TEMPLATE_BACKEND_TO_FRONTEND[normalized] ?? TEMPLATE_BACKEND_TO_FRONTEND[trimmed.toUpperCase()] ?? "modern";
}

function templateFrontendToBackend(id: ResumeTemplateId): string {
  return TEMPLATE_FRONTEND_TO_BACKEND[id] ?? "MODERN";
}

// ---------------------------------------------------------------------------
// Section key mapping  (frontend id ↔ backend key)
// ---------------------------------------------------------------------------

const SECTION_KEY_FE_TO_BE: Record<string, string> = {
  experience: "EXPERIENCES",
  education: "EDUCATIONS",
  skills: "SKILLS",
  projects: "PROJECTS",
  certifications: "CERTIFICATIONS",
  profile: "PROFILE",
};

const SECTION_KEY_BE_TO_FE: Record<string, string> = {
  ...Object.fromEntries(Object.entries(SECTION_KEY_FE_TO_BE).map(([k, v]) => [v, k])),
  SUMMARY: "profile",
};

// ---------------------------------------------------------------------------
// Safe JSON parse helper
// ---------------------------------------------------------------------------

function safeParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

// ---------------------------------------------------------------------------
// Backend → Frontend
// ---------------------------------------------------------------------------

/** List/detail payloads may use snake_case or camelCase for the base-resume flag */
function readIsBaseResumeFlag(dto: Record<string, unknown>): boolean {
  const raw = dto.is_base_resume ?? dto.isBase ?? dto.is_base;
  if (raw === true || raw === 1) return true;
  if (raw === "true") return true;
  return false;
}

/**
 * Convert a single resume DTO from the Django serializer into the
 * frontend `ResumeData` shape.
 */
export function mapBackendResumeToFrontend(dto: Record<string, unknown>): ResumeData {
  const profile = safeParse<Record<string, unknown>>(dto.profile, {});
  const experiences = safeParse<Record<string, unknown>[]>(dto.experiences, []);
  const educations = safeParse<Record<string, unknown>[]>(dto.educations, []);
  const skillsRaw = safeParse<unknown[]>(dto.skills, []);
  const skills = skillsRaw.map((s, idx) =>
    typeof s === "string" ? { id: String(idx), skill: s, hidden: false } : (s as Record<string, unknown>)
  );
  const projects = safeParse<Record<string, unknown>[]>(dto.projects, []);
  const certifications = safeParse<Record<string, unknown>[]>(dto.certifications, []);
  const customSectionsRaw = safeParse<unknown>(dto.custom_sections, null);
  const sectionOrderRaw = safeParse<unknown[]>(dto.section_order, []);

  const mappedSkills = skills.map(mapSkill);
  const derivedSkillCategories = buildSkillCategories(mappedSkills);

  const slugRaw = dto.slug;
  const slug = typeof slugRaw === "string" && slugRaw.trim().length > 0 ? slugRaw.trim() : undefined;
  const publishedAtRaw = dto.published_at ?? dto.publishedAt;
  const publishedAt =
    typeof publishedAtRaw === "string" && publishedAtRaw.trim().length > 0 ? publishedAtRaw.trim() : (publishedAtRaw ?? undefined);

  const educationLeftRaw = dto.education_left_column ?? dto.educationLeftColumn;

  return {
    // Identity / metadata
    id: String(dto.resume_id ?? dto.id ?? ""),
    title: String(dto.name ?? "Untitled Resume"),
    templateId: templateBackendToFrontend(dto.template as string | undefined),
    lastModified: new Date((dto.updated_at as string) ?? (dto.created_at as string) ?? Date.now()),
    isBase: readIsBaseResumeFlag(dto),
    ...(slug ? { slug } : {}),
    ...(publishedAt ? { publishedAt: String(publishedAt) } : {}),

    // Profile
    profile: mapProfile(profile, dto.summary),

    // Sections
    experience: experiences.map(mapExperience),
    education: educations.map(mapEducation),
    skills: mappedSkills,
    skillCategories: derivedSkillCategories,
    projects: projects.map(mapProject),
    certifications: certifications.map(mapCertification),
    customSections: mapCustomSectionsIn(customSectionsRaw),
    sectionOrder: mapSectionOrderIn(sectionOrderRaw),
    ...(educationLeftRaw !== undefined && educationLeftRaw !== null ? { educationLeftColumn: Boolean(educationLeftRaw) } : {}),
  };
}

// ---- Profile ----

function mapProfile(p: Record<string, unknown>, topLevelSummary: unknown): ResumeProfile {
  return {
    fullName: String(p.name ?? ""),
    email: String(p.email ?? ""),
    phone: String(p.phone ?? ""),
    city: String(p.city ?? ""),
    country: String(p.country ?? ""),
    linkedin: (p.linkedin as string) ?? undefined,
    github: (p.github as string) ?? undefined,
    portfolio: (p.portfolio as string) ?? undefined,
    picture: (p.picture as string) ?? undefined,
    summary: String(topLevelSummary ?? p.summary ?? ""),
    title: (p.your_title as string) ?? (p.title as string) ?? undefined,
  };
}

// ---- Experiences ----

function mapExperience(e: Record<string, unknown>, idx: number): ResumeExperience {
  const rawStart = String(e.startDate ?? "");
  const rawEnd = String(e.endDate ?? "");
  const startDate = normalizeResumeMonthStorage(rawStart) ?? rawStart;
  const endDate =
    rawEnd.trim().length > 0 && !/present|current|now/i.test(rawEnd.trim()) ? (normalizeResumeMonthStorage(rawEnd) ?? rawEnd) : rawEnd;
  return {
    id: String(e.id ?? idx),
    company: String(e.organisation ?? e.company ?? ""),
    role: String(e.role ?? ""),
    startDate,
    endDate,
    current: /present|current|now/i.test(rawEnd.trim()),
    location: (e.location as string) ?? undefined,
    description: descToString(e.descriptions ?? e.description),
    hidden: Boolean(e.hidden),
  };
}

// ---- Educations ----

function mapEducation(e: Record<string, unknown>, idx: number): ResumeEducation {
  const rawStart = String(e.startDate ?? "");
  const rawEnd = String(e.endDate ?? "");
  const startDate = normalizeResumeMonthStorage(rawStart) ?? rawStart;
  const endDate =
    rawEnd.trim().length > 0 && !/present|current|now/i.test(rawEnd.trim()) ? (normalizeResumeMonthStorage(rawEnd) ?? rawEnd) : rawEnd;
  return {
    id: String(e.id ?? idx),
    school: String(e.institution ?? e.school ?? ""),
    degree: String(e.course ?? e.degree ?? ""),
    startDate,
    endDate,
    current: /present|current|now/i.test(rawEnd.trim()),
    location: (e.location as string) ?? undefined,
    description: descToString(e.courseWork ?? e.description),
    hidden: Boolean(e.hidden),
  };
}

// ---- Skills ----

function mapSkill(s: Record<string, unknown>, idx: number): ResumeSkill {
  const rawCategory = String((s.category as string) ?? "").trim();
  const rawCategoryId = String((s.categoryId as string) ?? "").trim();
  const rawLevel = String((s.level as string) ?? "").trim();
  const category = rawCategory.length > 0 ? rawCategory : rawLevel.length > 0 ? rawLevel : undefined;
  const categoryId = rawCategoryId.length > 0 ? rawCategoryId : category ? category : undefined;

  return {
    id: String(s.id ?? idx),
    name: String(s.skill ?? s.name ?? ""),
    category,
    categoryId,
    hidden: Boolean(s.hidden),
  };
}

function buildSkillCategories(skills: ResumeSkill[]) {
  const seen = new Set<string>();
  const categories: { id: string; name: string }[] = [];

  for (const skill of skills) {
    const id = skill.categoryId?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    categories.push({
      id,
      name: skill.category?.trim() || id,
    });
  }

  return categories;
}

// ---- Projects ----

function mapProject(p: Record<string, unknown>, idx: number): ResumeProject {
  return {
    id: String(p.id ?? idx),
    title: String(p.title ?? ""),
    url: (p.url as string) ?? undefined,
    description: descToString(p.descriptions ?? p.description),
    hidden: Boolean(p.hidden),
  };
}

// ---- Certifications ----

function mapCertification(c: Record<string, unknown>, idx: number): ResumeCertification {
  return {
    id: String(c.id ?? idx),
    title: String(c.title ?? ""),
    issuer: (c.issuer as string) ?? undefined,
    date: (c.date as string) ?? undefined,
    credentialUrl: String(c.credentialUrl ?? c.url ?? ""),
    description: descToString(c.description ?? c.descriptions),
    hidden: Boolean(c.hidden),
  };
}

// ---- Custom Sections ----

function mapCustomSectionsIn(raw: unknown): CustomSection[] {
  if (!raw) return [];

  // Array form — already in frontend shape
  if (Array.isArray(raw)) {
    return (raw as Record<string, unknown>[]).map(s => {
      const leftCol = s.leftColumn;
      const col =
        leftCol === true ? ("left" as const) : leftCol === false ? ("right" as const) : (s.column as "left" | "right" | undefined);
      return {
        id: String(s.id ?? Date.now()),
        title: String(s.title ?? s.sectionName ?? "Untitled"),
        items: Array.isArray(s.items) ? (s.items as Record<string, unknown>[]).map(mapCustomSectionItem) : [],
        ...(col ? { column: col } : {}),
      };
    });
  }

  // Object form: `{ [sectionId]: { sectionName, data: [...], leftColumn? } }`
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, Record<string, unknown>>).map(([id, section]) => {
      const leftCol = section.leftColumn;
      const col =
        leftCol === true ? ("left" as const) : leftCol === false ? ("right" as const) : (section.column as "left" | "right" | undefined);
      return {
        id,
        title: String(section.sectionName ?? "Untitled"),
        items: Array.isArray(section.data) ? (section.data as Record<string, unknown>[]).map(mapCustomSectionItem) : [],
        ...(col ? { column: col } : {}),
      };
    });
  }

  return [];
}

function mapCustomSectionItem(item: Record<string, unknown>): CustomSectionItem {
  return {
    id: String(item.id ?? Date.now()),
    title: (item.title as string) ?? undefined,
    subtitle: (item.subtitle as string) ?? undefined,
    description: descToString(item.description ?? item.descriptions),
    location: (item.location as string) ?? undefined,
    startDate: (item.startDate as string) ?? undefined,
    endDate: (item.endDate as string) ?? undefined,
    current: item.endDate === "Present" || item.endDate === "present",
    hasDates: Boolean(item.hasDates ?? item.startDate),
    hasLocation: Boolean(item.hasLocation ?? item.location),
    hidden: Boolean(item.hidden),
  };
}

// ---- Section Order ----

function mapSectionOrderIn(raw: unknown[]): SectionOrderItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    // Sensible default when backend has none
    return [{ id: "profile" }, { id: "experience" }, { id: "education" }, { id: "skills" }, { id: "projects" }, { id: "certifications" }];
  }

  const mapped = raw.map(entry => {
    if (typeof entry !== "object" || entry === null) {
      return { id: String(entry) };
    }

    // Backend form: `{ EXPERIENCES: { hidden: false, left?: true } }`
    const obj = entry as Record<string, unknown>;
    const backendKey = Object.keys(obj)[0];
    const meta = obj[backendKey] as Record<string, unknown> | undefined;

    const frontendId = SECTION_KEY_BE_TO_FE[backendKey] ?? backendKey.toLowerCase();

    return {
      id: frontendId,
      hidden: Boolean(meta?.hidden),
      column: meta?.left === true ? ("left" as const) : meta?.left === false ? ("right" as const) : undefined,
    };
  });

  // Deduplicate by id so the same section never appears twice (backend may send duplicates)
  const seen = new Set<string>();
  const deduplicated = mapped.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Backend section_order intentionally excludes PROFILE, but the editor
  // navigation always expects it to be present.
  if (!deduplicated.some(item => item.id === "profile")) {
    return [{ id: "profile" }, ...deduplicated];
  }

  return deduplicated;
}

// ---- Helpers ----

/**
 * Normalise descriptions: the backend may store an HTML string, an array
 * of bullet strings, or already be a string.
 */
function descToString(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const items = raw.map(item => (typeof item === "string" ? item : String(item))).filter(item => item.trim().length > 0);

    if (!items.length) return "";

    // Represent bullets as an HTML list so both the editor preview
    // (HtmlDisplay) and PDFs (HtmlRenderer) render real bullet points.
    const inner = items.map(item => `<li>${item}</li>`).join("");
    return `<ul>${inner}</ul>`;
  }
  return String(raw);
}

// ---------------------------------------------------------------------------
// Frontend → Backend
// ---------------------------------------------------------------------------

/** Full ADK session state for resume context. */
export function buildAdkResumeStateDelta(resume: ResumeData): ResumeAdkStateDeltaPayload {
  const backendResume = mapFrontendResumeToBackend(resume);
  return {
    active_context: "resume",
    current_resume: resume.id,
    resume_data: {
      [resume.id]: backendResume,
    },
  };
}

export function buildAdkResumeDataMap(resumes: Record<string, ResumeData>): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [id, resume] of Object.entries(resumes)) {
    if (!id || !resume) continue;
    out[id] = mapFrontendResumeToBackend(resume);
  }
  return out;
}

/** Convert ADK session state resume_data back to frontend ResumeData map. */
export function mapAdkResumeDataMapToFrontend(rawResumeData: unknown): Record<string, ResumeData> {
  if (!rawResumeData || typeof rawResumeData !== "object") {
    return {};
  }

  const result: Record<string, ResumeData> = {};
  for (const [resumeId, rawResume] of Object.entries(rawResumeData as Record<string, unknown>)) {
    if (!resumeId || !rawResume || typeof rawResume !== "object") {
      continue;
    }

    const normalized = {
      ...(rawResume as Record<string, unknown>),
      id: String((rawResume as Record<string, unknown>).id ?? resumeId),
      resume_id: String((rawResume as Record<string, unknown>).resume_id ?? resumeId),
    };

    result[resumeId] = mapBackendResumeToFrontend(normalized);
  }

  return result;
}

/**
 * Convert the frontend `ResumeData` into the shape Django's
 * `update_resume_content` view expects.
 */
export function mapFrontendResumeToBackend(resume: ResumeData): Record<string, unknown> {
  const slug = resume.slug?.trim();
  return {
    // Identity / meta
    id: resume.id,
    resume_id: resume.id,
    name: resume.title,
    template: templateFrontendToBackend(resume.templateId),
    is_base_resume: Boolean(resume.isBase),
    ...(slug ? { slug } : {}),

    // Profile (without summary, which is top-level)
    profile: {
      name: resume.profile.fullName,
      email: resume.profile.email,
      phone: resume.profile.phone,
      city: resume.profile.city,
      country: resume.profile.country,
      linkedin: resume.profile.linkedin ?? "",
      github: resume.profile.github ?? "",
      portfolio: resume.profile.portfolio ?? "",
      picture: resume.profile.picture ?? "",
      your_title: resume.profile.title ?? "",
    },

    // Summary is stored at the top level by the backend
    summary: resume.profile.summary,

    ...(resume.educationLeftColumn !== undefined ? { education_left_column: Boolean(resume.educationLeftColumn) } : {}),

    // Sections
    experiences: resume.experience.map(mapExperienceOut),
    educations: resume.education.map(mapEducationOut),
    skills: resume.skills.map(mapSkillOut),
    projects: resume.projects.map(mapProjectOut),
    certifications: resume.certifications.map(mapCertificationOut),
    custom_sections: mapCustomSectionsOut(resume.customSections),
    section_order: mapSectionOrderOut(resume.sectionOrder),
  };
}

// ---- Experiences ----

function mapExperienceOut(e: ResumeExperience) {
  return {
    id: e.id,
    organisation: e.company,
    role: e.role,
    startDate: e.startDate,
    endDate: e.current ? "Present" : e.endDate,
    location: e.location ?? "",
    descriptions: e.description,
    hidden: Boolean(e.hidden),
  };
}

// ---- Educations ----

function mapEducationOut(e: ResumeEducation) {
  return {
    id: e.id,
    institution: e.school,
    course: e.degree,
    startDate: e.startDate,
    endDate: e.current ? "Present" : e.endDate,
    location: e.location ?? "",
    courseWork: e.description ?? "",
    hidden: Boolean(e.hidden),
  };
}

// ---- Skills ----

function mapSkillOut(s: ResumeSkill) {
  return {
    id: s.id,
    category: s.category ?? s.categoryId ?? "",
    categoryId: s.categoryId ?? "",
    skill: s.name,
    hidden: Boolean(s.hidden),
  };
}

// ---- Projects ----

function mapProjectOut(p: ResumeProject) {
  return {
    id: p.id,
    title: p.title,
    url: p.url ?? "",
    descriptions: p.description,
    hidden: Boolean(p.hidden),
  };
}

// ---- Certifications ----

function mapCertificationOut(c: ResumeCertification) {
  return {
    id: c.id,
    title: c.title,
    issuer: c.issuer ?? "",
    date: c.date ?? "",
    credentialUrl: c.credentialUrl ?? "",
    description: c.description ?? "",
    hidden: Boolean(c.hidden),
  };
}

// ---- Custom Sections ----

function mapCustomSectionsOut(sections: CustomSection[]): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const section of sections) {
    const leftColumn = section.column === "left" ? true : section.column === "right" ? false : undefined;
    result[section.id] = {
      sectionName: section.title,
      ...(leftColumn !== undefined ? { leftColumn } : {}),
      data: section.items.map(item => ({
        id: item.id,
        title: item.title ?? "",
        subtitle: item.subtitle ?? "",
        description: item.description ?? "",
        location: item.location ?? "",
        startDate: item.startDate ?? "",
        endDate: item.current ? "Present" : (item.endDate ?? ""),
        hasDates: Boolean(item.hasDates),
        hasLocation: Boolean(item.hasLocation),
        hidden: Boolean(item.hidden),
      })),
    };
  }
  return result;
}

// ---- Section Order ----

function mapSectionOrderOut(order: SectionOrderItem[]): Record<string, unknown>[] {
  return order
    .filter(item => item.id !== "profile") // Backend doesn't track profile in section_order
    .map(item => {
      const backendKey = SECTION_KEY_FE_TO_BE[item.id] ?? item.id.toUpperCase();
      const meta: Record<string, unknown> = { hidden: Boolean(item.hidden) };
      if (item.column === "left") {
        meta.left = true;
      } else if (item.column === "right") {
        meta.left = false;
      }
      return { [backendKey]: meta };
    });
}
