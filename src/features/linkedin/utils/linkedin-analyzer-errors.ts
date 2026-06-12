import type { LinkedInAnalyzerErrorCode } from "@/features/linkedin/types";

export const LINKEDIN_PROFILE_SETTINGS_PATH = "/uniboard/user/profile";

const PROFILE_URL_ERROR_CODES = new Set<LinkedInAnalyzerErrorCode>([
  "LINKEDIN_URL_INVALID",
  "LINKEDIN_URL_MISSING",
  "PROFILE_NOT_FOUND",
  "EMPTY_PROFILE",
]);

export function isLinkedInProfileUrlError(code?: LinkedInAnalyzerErrorCode): boolean {
  return Boolean(code && PROFILE_URL_ERROR_CODES.has(code));
}

export function linkedInAnalyzerErrorMessage(error: string, code?: LinkedInAnalyzerErrorCode): string {
  if (error.trim()) return error.trim();
  if (code === "LINKEDIN_URL_MISSING") {
    return "Add your LinkedIn profile URL in your Unimad profile settings.";
  }
  if (code === "PROFILE_NOT_FOUND" || code === "EMPTY_PROFILE") {
    return "We could not find a public LinkedIn profile for that URL. Check that the link is correct and the profile is public.";
  }
  if (code === "SCRAPER_UNAVAILABLE") {
    return "LinkedIn profile analysis is temporarily unavailable. Please try again in a few minutes.";
  }
  return "Failed to analyze your LinkedIn profile. Please try again.";
}
