/**
 * Cold email asset as returned by the application-assets API.
 */
export interface ColdEmailAsset {
  id: string | number;
  role: string;
  company: string;
  job_description?: string;
  jd?: string;
  hirname?: string;
  managerName?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  dateScheduled?: string | null;
  status?: string;
  dateSent?: string | null;
}

/**
 * Payload for generating a new cold email.
 */
export interface GenerateColdEmailParams {
  role: string;
  company: string;
  job_description: string;
  hirname: string;
  application_id?: string | number;
}

/**
 * Payload for updating an existing cold email's content.
 */
export interface UpdateColdEmailParams {
  id: string | number;
  content: string;
}

/**
 * Backend duplicate (409) response shape.
 */
export interface ColdEmailDuplicateError {
  existing_asset_id: string | number;
  message?: string;
}

/**
 * Backend generate response on success.
 */
export interface GenerateColdEmailSuccess {
  id: string | number;
}

/**
 * Backend generate response when duplicate exists (409).
 */
export interface GenerateColdEmailDuplicateResponse {
  error: {
    data: ColdEmailDuplicateError;
    message?: string;
  };
}

/**
 * Backend generate response when subscription is required.
 */
export interface GenerateColdEmailSubscriptionResponse {
  error_code: "NOT_A_PLUS_MEMBER";
}
