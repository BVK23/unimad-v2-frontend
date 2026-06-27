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
  application_asset_draft_preview?: string;
  application_asset_accepted_body?: string;
  application_asset_current_date?: string;
  studio_headless?: boolean;
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
      accepted_body?: string;
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
  draftPreview?: string;
  acceptedBody?: string;
  studioHeadless?: boolean;
  profileSnapshot?: ApplicationAssetProfileSnapshot;
  /** Generate Another: agent should treat as first draft (empty session body, accepted kept for UI). */
  regenerateDraft?: boolean;
};

export const buildAdkApplicationAssetStateDelta = (
  input: BuildApplicationAssetStateDeltaInput = {}
): ApplicationAssetAdkStateDeltaPayload => {
  const delta: ApplicationAssetAdkStateDeltaPayload = {
    active_context: "application_asset",
    application_asset_current_date: formatCoverLetterDate(),
  };

  if (input.studioHeadless) {
    delta.studio_headless = true;
  }
  if (input.profileSnapshot) {
    delta.application_asset_profile_snapshot = input.profileSnapshot;
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
  const role = input.role?.trim();
  if (role) {
    delta.application_role = role;
  }
  const company = input.company?.trim();
  if (company) {
    delta.application_company = company;
  }
  const jd = input.jobDescription?.trim();
  if (jd) {
    delta.application_jd = jd.slice(0, 12000);
  }
  const contact = input.contactName?.trim();
  if (contact) {
    delta.application_contact_name = contact;
  }
  const draft = input.draftPreview?.trim();
  const accepted = input.acceptedBody?.trim();
  /** Agent tools read `body`; PATCH must not send accepted-only without body or improve sees an empty draft. */
  const sessionBody = input.regenerateDraft ? "" : ((draft || accepted)?.slice(0, 8000) ?? "");
  if (sessionBody) {
    delta.application_asset_draft_preview = sessionBody;
    delta.current_application_asset = "active";
    delta.application_asset_data = {
      active: {
        asset_type: input.assetType ?? "",
        asset_id: input.assetId ?? "",
        application_id: input.applicationId ?? "",
        role: role ?? "",
        company: company ?? "",
        job_description: jd ?? "",
        contact_name: contact ?? "",
        body: sessionBody,
        accepted_body: accepted?.slice(0, 8000) ?? "",
      },
    };
  } else if (input.assetType || input.assetId || input.studioHeadless) {
    delta.current_application_asset = "active";
    delta.application_asset_data = {
      active: {
        asset_type: input.assetType ?? "",
        asset_id: input.assetId ?? "",
        application_id: input.applicationId ?? "",
        role: role ?? "",
        company: company ?? "",
        job_description: jd ?? "",
        contact_name: contact ?? "",
        accepted_body: accepted?.slice(0, 8000) ?? "",
      },
    };
  }
  if (accepted) {
    delta.application_asset_accepted_body = accepted.slice(0, 8000);
  }

  return delta;
};
