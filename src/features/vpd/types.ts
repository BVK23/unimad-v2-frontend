import type { PortfolioItem } from "@/types";

export type VpdCoverPic = {
  url?: string;
  blob_name?: string;
  position?: { x: number; y: number };
  /** When false, cover is hidden in the editor/canvas but the URL is kept. */
  show?: boolean;
  /** Optional company/application icon overlapping the cover. */
  icon_url?: string;
};

export type VpdEditorContentV2 = {
  schemaVersion: 2;
  items: PortfolioItem[];
};

export type VpdApiData = {
  id?: string;
  vpdId?: string;
  title?: string;
  role?: string;
  company?: string;
  job_description?: string;
  cover_pic?: VpdCoverPic;
  editor_content?: VpdEditorContentV2 | PortfolioItem[] | unknown;
  slug?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  application_id?: string | null;
};

export type GenerateVpdParams = {
  role?: string;
  company?: string;
  jobDescription?: string;
  application_id?: string;
  /** Prefill VPD icon from job/company logo (stored on cover_pic.icon_url). */
  company_logo_url?: string;
  schemaVersion?: 1 | 2;
};

export type GenerateVpdSuccess = {
  id: string;
  vpdData: VpdApiData;
  application_id?: string;
  is_new_application?: boolean;
  message?: string;
};

export type GenerateVpdDuplicate = {
  duplicate: true;
  existing_vpd_id: string;
  application_id?: string;
  message?: string;
};

export type GenerateVpdResult = GenerateVpdSuccess | GenerateVpdDuplicate;

export const isGenerateVpdDuplicate = (result: GenerateVpdResult): result is GenerateVpdDuplicate =>
  "duplicate" in result && result.duplicate === true;

export type VpdLandingData = {
  userVpds: VpdApiData[];
  /** Legacy BlockNote templates (V1) — used by unimadai-frontendapp. */
  vpdTemplates?: unknown[];
  /** Studio portfolio-grid templates (schemaVersion 2). */
  vpdTemplatesV2?: VpdTemplateApi[];
};

/** Backend V2 template fixture shape from `/api/vpd/landing/`. */
export type VpdTemplateApi = {
  id: string;
  label?: string;
  name?: string;
  title?: string;
  cover_pic?: VpdCoverPic;
  editor_content?: VpdEditorContentV2 | PortfolioItem[] | unknown;
  schemaVersion?: 2;
};

/** Studio Recents / library card shape. */
export type VpdStudioListItem = {
  id: string;
  title: string;
  date: string;
  isTemplate?: boolean;
  slug?: string | null;
  role?: string;
  company?: string;
  job_description?: string;
  project: PortfolioItem;
};
