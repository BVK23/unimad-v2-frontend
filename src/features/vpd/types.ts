import type { PortfolioItem } from "@/types";

export type VpdCoverPic = {
  url?: string;
  blob_name?: string;
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
  /** Legacy BlockNote templates from backend — unused by Studio Recents. */
  vpdTemplates?: unknown[];
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
