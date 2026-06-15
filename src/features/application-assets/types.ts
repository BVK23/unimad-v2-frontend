export type ApplicationAssetApiType = "coverletter" | "coldemail" | "referral";

export type ApplicationAssetStudioTopic = "cover-letter" | "cold-email" | "referral";

export const STUDIO_TOPIC_TO_API_TYPE: Record<ApplicationAssetStudioTopic, ApplicationAssetApiType> = {
  "cover-letter": "coverletter",
  "cold-email": "coldemail",
  referral: "referral",
};

export const API_TYPE_TO_STUDIO_TOPIC: Record<ApplicationAssetApiType, ApplicationAssetStudioTopic> = {
  coverletter: "cover-letter",
  coldemail: "cold-email",
  referral: "referral",
};

export type ApplicationAssetStatus = "draft" | "accepted";

export type CreateApplicationAssetShellParams = {
  type: ApplicationAssetApiType;
  role: string;
  company: string;
  job_description?: string;
  hirname?: string;
  conname?: string;
  application_id?: string | number;
};

export type ApplicationAssetCheckResult =
  | { ok: true }
  | { error: { data: { existing_asset_id: string | number }; message?: string } }
  | { error_code: "NOT_A_PLUS_MEMBER" };

export type ApplicationAssetCreateOnAcceptResult =
  | { id: string | number; application_id?: string; status: ApplicationAssetStatus }
  | { error: { data: { existing_asset_id: string | number }; message?: string } };

export type ApplicationAssetGenerateDraftResult = {
  type: ApplicationAssetApiType;
  content: string;
  role: string;
  company: string;
  job_description?: string;
  contact_name?: string;
};

export type SelectionSuggestion = {
  id: string;
  label: string;
  instruction: string;
};

export type FetchSelectionSuggestionsParams = {
  type: ApplicationAssetApiType;
  selectedText: string;
  documentBody?: string;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
  assetId?: string | null;
};
