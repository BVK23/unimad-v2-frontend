import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ApplicationAssetProfileSnapshot } from "@/features/application-assets/utils/applicationAssetProfileSnapshot";
import { formatCoverLetterDate } from "@/features/application-assets/utils/formatCoverLetterDate";

export type ApplicationAssetAdkStateDeltaPayload = {
  active_context: "application_asset";
  application_asset_type?: ApplicationAssetApiType;
  application_asset_id?: string | null;
  application_id?: string | null;
  application_role?: string;
  application_company?: string;
  application_jd?: string;
  application_contact_name?: string;
  /**
   * Single current document body for ADK (what the user sees in Studio).
   * Key name is legacy (`draft_preview`); tools read this as `body`.
   */
  application_asset_draft_preview?: string;
  application_asset_current_date?: string;
  studio_headless?: boolean;
  /** Only for studio headless generate — not needed for Unibot improve chat. */
  application_asset_profile_snapshot?: ApplicationAssetProfileSnapshot;
  application_asset_data?: Record<
    string,
    {
      asset_type?: string;
      asset_id?: string;
      application_id?: string;
      role?: string;
      company?: string;
      job_description?: string;
      contact_name?: string;
      body?: string;
    }
  >;
  current_application_asset?: string;
};

export type BuildApplicationAssetStateDeltaInput = {
  assetType?: ApplicationAssetApiType;
  assetId?: string | null;
  applicationId?: string | null;
  role?: string;
  company?: string;
  jobDescription?: string;
  contactName?: string;
  /** Current Studio document (live edits). One body for ADK — not draft vs accepted. */
  draftPreview?: string;
  studioHeadless?: boolean;
  profileSnapshot?: ApplicationAssetProfileSnapshot;
  /** Generate Another: clear session body so agent writes a fresh draft. */
  regenerateDraft?: boolean;
};

/**
 * Contact names are only valid for cold email (hiring manager) and referral (connection).
 * Cover letters always PATCH `contact_name: ""` so a leftover personal name cannot
 * leak into cover-letter session state. Never invent names in prompts — only use
 * values from Zustand that were patched into the session.
 */
function contactNameForAssetType(assetType: ApplicationAssetApiType | undefined, contactName: string | undefined): string {
  if (assetType === "coldemail" || assetType === "referral") {
    return contactName?.trim() ?? "";
  }
  return "";
}

export const buildAdkApplicationAssetStateDelta = (
  input: BuildApplicationAssetStateDeltaInput = {}
): ApplicationAssetAdkStateDeltaPayload => {
  const delta: ApplicationAssetAdkStateDeltaPayload = {
    active_context: "application_asset",
    application_asset_current_date: formatCoverLetterDate(),
  };

  if (input.studioHeadless) {
    delta.studio_headless = true;
    if (input.profileSnapshot) {
      delta.application_asset_profile_snapshot = input.profileSnapshot;
    }
  }

  if (input.assetType) {
    delta.application_asset_type = input.assetType;
  }
  if (input.assetId) {
    delta.application_asset_id = input.assetId;
  }
  if (input.applicationId) {
    delta.application_id = input.applicationId;
  }

  const role = input.role?.trim() ?? "";
  const company = input.company?.trim() ?? "";
  const jd = input.jobDescription?.trim() ?? "";
  const contact = contactNameForAssetType(input.assetType, input.contactName);

  /**
   * Always write context keys (including empty strings) when we have an asset type.
   * Omitting empty keys left stale ADK session values (wrong company / leftover contact name).
   */
  if (input.assetType || input.assetId || input.studioHeadless || role || company || jd) {
    delta.application_role = role;
    delta.application_company = company;
    delta.application_jd = jd.slice(0, 12000);
    delta.application_contact_name = contact;
  }

  /** One document body: whatever Studio is showing (live edits included). */
  const sessionBody = input.regenerateDraft ? "" : (input.draftPreview?.trim().slice(0, 8000) ?? "");

  const activeRow = {
    asset_type: input.assetType ?? "",
    asset_id: input.assetId ?? "",
    application_id: input.applicationId ?? "",
    role,
    company,
    job_description: jd.slice(0, 12000),
    contact_name: contact,
    body: sessionBody,
  };

  if (input.assetType || input.assetId || input.studioHeadless || sessionBody) {
    delta.current_application_asset = "active";
    delta.application_asset_data = { active: activeRow };
  }
  if (sessionBody) {
    delta.application_asset_draft_preview = sessionBody;
  }

  return delta;
};
