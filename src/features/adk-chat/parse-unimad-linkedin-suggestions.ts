export type LinkedInSuggestionSection = "headline" | "about" | "experience" | "skills" | "cover" | "pic";

export type LinkedInExperienceSuggestion = {
  title: string;
  company: string;
  description: string;
};

export type LinkedInProfilePicGuidance = {
  idealDescription?: string;
  whatWorks?: string;
  whatToImprove?: string;
  reassurance?: string;
};

export type LinkedInGuideSlide = {
  src: string;
  label: string;
};

export type UnimadLinkedInSuggestionsPayload = {
  section: LinkedInSuggestionSection;
  linkedinEditHint?: string;
  guideImageUrl?: string;
  guideImageSlides?: LinkedInGuideSlide[];
  headlineVariants?: string[];
  aboutDraft?: string;
  experiences?: LinkedInExperienceSuggestion[];
  topSkills?: string[];
  additionalSkills?: string[];
  skillsLinkedinTip?: string;
  coverTaglines?: string[];
  profilePicGuidance?: LinkedInProfilePicGuidance;
  showReanalyseCta?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => String(v ?? "").trim()).filter(Boolean);
}

function parseExperiences(value: unknown): LinkedInExperienceSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      const row = asRecord(item);
      if (!row) return null;
      const title = String(row.title ?? "").trim();
      const company = String(row.company ?? "").trim();
      const description = String(row.description ?? "").trim();
      if (!title && !company && !description) return null;
      return { title, company, description };
    })
    .filter((x): x is LinkedInExperienceSuggestion => x !== null);
}

function parseGuideSlides(value: unknown): LinkedInGuideSlide[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      const row = asRecord(item);
      if (!row) return null;
      const src = String(row.url ?? row.src ?? "").trim();
      const label = String(row.label ?? "").trim();
      if (!src) return null;
      return { src, label: label || "Guide step" };
    })
    .filter((x): x is LinkedInGuideSlide => x !== null);
}

export function parseLinkedInSuggestionsFromToolResponse(
  response: Record<string, unknown> | undefined
): UnimadLinkedInSuggestionsPayload | null {
  if (!response || response.status !== "ok") return null;

  const ui = asRecord(response.ui);
  const raw = ui ? asRecord(ui.linkedin_suggestions) : null;
  if (!raw) return null;

  const section = String(raw.section ?? "")
    .trim()
    .toLowerCase();
  const valid: LinkedInSuggestionSection[] = ["headline", "about", "experience", "skills", "cover", "pic"];
  if (!valid.includes(section as LinkedInSuggestionSection)) return null;

  const payload: UnimadLinkedInSuggestionsPayload = {
    section: section as LinkedInSuggestionSection,
    linkedinEditHint: String(raw.linkedin_edit_hint ?? "").trim() || undefined,
    guideImageUrl: String(raw.guide_image_url ?? "").trim() || undefined,
  };

  const guideSlides = parseGuideSlides(raw.guide_image_slides);
  if (guideSlides.length > 0) {
    payload.guideImageSlides = guideSlides;
    if (!payload.guideImageUrl) {
      payload.guideImageUrl = guideSlides[0]?.src;
    }
  }

  if (section === "headline") {
    const variants = asStringArray(raw.headline_variants);
    if (variants.length === 0) return null;
    payload.headlineVariants = variants.slice(0, 3);
  } else if (section === "about") {
    const text = String(raw.about_draft ?? "").trim();
    if (!text) return null;
    payload.aboutDraft = text;
  } else if (section === "experience") {
    const experiences = parseExperiences(raw.experiences);
    if (experiences.length === 0) return null;
    payload.experiences = experiences;
  } else if (section === "skills") {
    const top = asStringArray(raw.top_skills);
    if (top.length === 0) return null;
    payload.topSkills = top.slice(0, 5);
    payload.additionalSkills = asStringArray(raw.additional_skills);
    payload.skillsLinkedinTip = String(raw.skills_linkedin_tip ?? "").trim() || undefined;
  } else if (section === "cover") {
    const taglines = asStringArray(raw.cover_taglines);
    if (taglines.length === 0) return null;
    payload.coverTaglines = taglines.slice(0, 3);
  } else if (section === "pic") {
    const guidance = asRecord(raw.profile_pic_guidance);
    if (!guidance) return null;
    payload.profilePicGuidance = {
      idealDescription: String(guidance.ideal_description ?? "").trim() || undefined,
      whatWorks: String(guidance.what_works ?? "").trim() || undefined,
      whatToImprove: String(guidance.what_to_improve ?? "").trim() || undefined,
      reassurance: String(guidance.reassurance ?? "").trim() || undefined,
    };
    payload.showReanalyseCta = raw.show_reanalyse_cta === true || raw.show_reanalyse_cta === "true";
  }

  return payload;
}
