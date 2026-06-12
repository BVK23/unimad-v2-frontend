import { messageFromFailedResponse, looksLikeTechnicalErrorMessage, sanitizeUserFacingError } from "@/utils/message-from-failed-response";

export const LINKEDIN_JOB_IMPORT_FALLBACK =
  "We couldn't import this LinkedIn job link. LinkedIn restricts automated access to job postings for security — open the job in your browser, copy the public URL (linkedin.com/jobs/view/...), and paste it here. Feed, search, and app-only links won't work. You can also add the job manually.";

export const GENERIC_JOB_IMPORT_FALLBACK =
  "We couldn't import this job URL. Try a direct link to the full job posting, or enter the details manually.";

export function isLinkedInJobUrl(url: string): boolean {
  return /linkedin\.com/i.test(url);
}

const LINKEDIN_ERROR_CODES = new Set([
  "linkedin_collection_url",
  "linkedin_app_url",
  "not_scrapable",
  "empty_research",
  "missing_jd",
  "missing_role_or_company",
  "gemini_error",
]);

export function formatJobImportError(args: { url: string; status: number; bodyText: string; jsonError?: string; code?: string }): string {
  const { url, status, bodyText, jsonError, code } = args;
  const linkedIn = isLinkedInJobUrl(url);
  const fallback = linkedIn ? LINKEDIN_JOB_IMPORT_FALLBACK : GENERIC_JOB_IMPORT_FALLBACK;

  const backendMessage = messageFromFailedResponse(status, bodyText, jsonError);

  if (code && LINKEDIN_ERROR_CODES.has(code)) {
    return sanitizeUserFacingError(backendMessage, fallback);
  }

  if (linkedIn && looksLikeTechnicalErrorMessage(backendMessage)) {
    return LINKEDIN_JOB_IMPORT_FALLBACK;
  }

  return sanitizeUserFacingError(backendMessage, fallback);
}
