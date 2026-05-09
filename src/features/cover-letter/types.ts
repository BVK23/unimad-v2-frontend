/**
 * Cover letter asset as returned by the application-assets API.
 */
export interface CoverLetterAsset {
  id: string | number;
  role: string;
  company: string;
  job_description?: string;
  jd?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload for generating a new cover letter.
 */
export interface GenerateCoverLetterParams {
  role: string;
  company: string;
  job_description: string;
  application_id?: string;
}

/**
 * Payload for updating an existing cover letter's content.
 */
export interface UpdateCoverLetterParams {
  id: string | number;
  content: string;
}

/**
 * Backend duplicate (409) response shape.
 */
export interface CoverLetterDuplicateError {
  existing_asset_id: string | number;
  message?: string;
}

/**
 * Backend generate response on success.
 */
export interface GenerateCoverLetterSuccess {
  id: string | number;
}

/**
 * Backend generate response when duplicate exists (409).
 */
export interface GenerateCoverLetterDuplicateResponse {
  error: {
    data: CoverLetterDuplicateError;
    message?: string;
  };
}

/**
 * Backend generate response when subscription is required.
 */
export interface GenerateCoverLetterSubscriptionResponse {
  error_code: "NOT_A_PLUS_MEMBER";
}
