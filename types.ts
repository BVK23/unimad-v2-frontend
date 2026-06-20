// Portfolio & Content Types
// Portfolio & Content Types
export type ContentType =
  | "text"
  | "image"
  | "video"
  | "link"
  | "project"
  | "code"
  | "service"
  | "collapsible"
  | "media"
  | "link-box"
  | "page-card"
  | "table"
  | "embed"
  | "box";

export type ColumnSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 12-column responsive editor grid

export interface PortfolioItem {
  id: string;
  type: ContentType;
  content: string; // URL for media/link, text content for text, code content
  title?: string; // For projects or links
  description?: string; // For projects
  span: ColumnSpan;
  colStart?: number; // Optional fixed grid start column for predictable horizontal resizing
  height?: number; // Optional fixed block height in px for stretch resize
  /** True after manual Y edge resize; auto-grow will not shrink below stored height */
  heightUserSet?: boolean;
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  fontWeight?: "normal" | "medium" | "bold";

  // New Fields for Enhanced Blocks
  codeLanguage?: string;
  servicePrice?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  mediaType?: "image" | "video" | "pdf";
  mediaName?: string;
  mediaMimeType?: string;
  cropRatio?: "1:1" | "3:4" | "4:5" | "16:9";
  showCoverImage?: boolean; // For page-card/project blocks
  linkUrl?: string;
  linkIcon?: string;
  detailedBlocks?: PortfolioItem[]; // For rich project pages
  variant?: string;
  /** Template layout slot; used to preserve old BlockNote width semantics on the 12-col grid */
  layoutRole?: "section" | "halfCard" | "linkChip" | "inlineMedia" | "quote" | "mediaHero";
  /** Set by initial portfolio generation for Quick Summary / Who am I? / USP; cleared after user edits title format */
  templateSectionTitle?: boolean;
  /** Set for Previous Experiences / Projects entry blocks; defaults title to semantic H2 until user changes heading */
  portfolioEntryTitle?: boolean;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
}

export interface UserProfile {
  name: string;
  tagline: string;
  bio: string; // Keeping for backward compatibility or hidden usage
  location: string;
  email: string;
  phone: string;
  website: string;
  /** Hero link chip label for profile.website (default Website). */
  websiteLabel?: string;
  avatarUrl: string;
  coverUrl: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  layout: "standard" | "centered";

  // New Alignment & Visibility flags
  profileAlignment?: "left" | "center" | "right";
  infoAlignment?: "left" | "center" | "right";
  coverCropRatio?: "1:1" | "3:4" | "4:5" | "16:9";
  showAvatar?: boolean;
  showCover?: boolean;
  /** When false, the profile card is hidden; blocks can still sit above where it was. */
  showProfileSection?: boolean;
  /** Number of portfolio blocks rendered above the profile card (0 = all blocks below). */
  itemsAboveProfileCount?: number;
  contactButtons?: ContactButton[];
}

export interface ContactButton {
  id: string;
  label: string;
  url: string;
  icon: "phone" | "mail" | "link" | "location";
  isVisible: boolean;
}

export interface PortfolioData {
  id: string;
  title: string;
  lastModified: Date;
  slug?: string;
  isBase?: boolean;
  themeMode?: "light" | "dark";
  customDomain?: string;
  profile: UserProfile;
  items: PortfolioItem[];
}

// Chat Types
export type AssetActionMeta = {
  kind: "preset" | "freeform";
  assetType: string;
  presetLabel?: string;
  selectedText: string;
  prompt: string;
};

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  /** ADK invocation id for rewind (user messages only). */
  invocationId?: string;
  // Topic / Context Support (improve sub-chats embedded in main transcript)
  isTopic?: boolean;
  topicTitle?: string;
  topicKind?: "content_gen" | "application_asset" | "improve";
  isExpanded?: boolean;
  messages?: ChatMessage[]; // Nested messages for this topic
  /** ADK session id for this improve thread (backend sub-session). */
  subSessionAdkId?: string;
  /** Set on auto-sent improve/section-review handoffs — excluded from chat title generation. */
  excludeFromTitleGeneration?: boolean;
  /** Assistant bubble failed (rate limit, stream error, etc.). */
  isError?: boolean;
  errorKind?: "rate_limit" | "generic";
  /** Present on user messages created by selection quick-action or freeform refine. */
  assetActionMeta?: AssetActionMeta;
  /** True when rebuilt from flat main-session history before sub-session migration. */
  legacyTopic?: boolean;
}

// --- Resume Types ---

export type ResumeTemplateId =
  | "modern"
  | "classic"
  | "minimal"
  | "us"
  | "canada"
  | "basic"
  | "ireland"
  | "aus"
  | "nextgen"
  | "professional"
  | "slatepro"
  | "primeslate";

export interface ResumeProfile {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  picture?: string;
  summary: string;
  title?: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location?: string;
  description: string;
  hidden?: boolean;
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  location?: string;
  description?: string;
  hidden?: boolean;
}

export interface ResumeSkill {
  id: string;
  name: string;
  /** Optional grouping/category label for skills UI (e.g. Frontend, Backend). */
  category?: string;
  /** Category id used by the grouped skills editor UI. */
  categoryId?: string;
  hidden?: boolean;
}

export interface ResumeProject {
  id: string;
  title: string;
  url?: string;
  description: string;
  hidden?: boolean;
}

export interface ResumeCertification {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  credentialUrl?: string;
  description?: string;
  hidden?: boolean;
}

export interface CustomSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  description: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  hasDates?: boolean;
  hasLocation?: boolean;
  hidden?: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
  /** Legacy two-column templates: section not in section_order uses this for left/right column */
  column?: "left" | "right";
}

export interface SectionOrderItem {
  id: string;
  hidden?: boolean;
  column?: "left" | "right"; // For two-column templates (future)
}

export interface ResumeData {
  id: string;
  title: string;
  lastModified: Date;
  templateId: ResumeTemplateId;
  /** Marks this resume as the user's base resume for PDF extraction flows. At most one per user. */
  isBase?: boolean;
  /** Public URL segment when backend provides a slug */
  slug?: string;
  /** ISO timestamp when resume was last published (`published_at` from API). */
  publishedAt?: string | null;
  profile: ResumeProfile;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  /** Group definitions used by the grouped skills editor UI. */
  skillCategories?: { id: string; name: string }[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  customSections: CustomSection[];
  sectionOrder: SectionOrderItem[];
  /** Nextgen-style education layout (legacy `educationLeftColumn`) */
  educationLeftColumn?: boolean;
}

// --- New Portfolio Modular Types ---

export type PortfolioBlockType =
  | "hero"
  | "proof_gallery"
  | "proof_casestudy"
  | "authority_metrics"
  | "authority_stack"
  | "narrative_bio"
  | "narrative_timeline"
  | "cta_contact"
  | "cta_calendly";

export interface PortfolioBlock {
  id: string;
  type: PortfolioBlockType;
  variant: string; // e.g., 'split', 'centered', 'full-bg'
  data: any; // Block-specific data (titles, descriptions, images, etc.)
}

export interface PortfolioPageSchema {
  id: string;
  name: string;
  category?: "Creative" | "Finance" | "Business" | "Professional" | "Tech";
  theme: {
    primaryColor: string;
    fontFamily: string;
    mode: "light" | "dark";
  };
  blocks: PortfolioBlock[];
}
