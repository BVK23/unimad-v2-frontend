/**
 * Referral asset as returned by the application-assets API.
 */
export interface ReferralAsset {
  id: string | number;
  role: string;
  company: string;
  conname?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  dateScheduled?: string | null;
  status?: string;
  dateSent?: string | null;
}

/**
 * Payload for generating a new referral.
 */
export interface GenerateReferralParams {
  role: string;
  company: string;
  conname: string;
  application_id?: string | number;
}

/**
 * Payload for updating an existing referral's content.
 */
export interface UpdateReferralParams {
  id: string | number;
  content: string;
}

/**
 * Backend duplicate (409) response shape.
 */
export interface ReferralDuplicateError {
  existing_asset_id: string | number;
  message?: string;
}

/**
 * Backend generate response on success.
 */
export interface GenerateReferralSuccess {
  id: string | number;
}

/**
 * Backend generate response when duplicate exists (409).
 */
export interface GenerateReferralDuplicateResponse {
  error: {
    data: ReferralDuplicateError;
    message?: string;
  };
}

/**
 * Backend generate response when subscription is required.
 */
export interface GenerateReferralSubscriptionResponse {
  error_code: "NOT_A_PLUS_MEMBER";
}
