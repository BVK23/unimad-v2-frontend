import type { LinkedInAnalyzerErrorCode } from "@/features/linkedin/types";
import {
  isLinkedInProfileUrlError,
  linkedInAnalyzerErrorMessage,
  LINKEDIN_PROFILE_SETTINGS_PATH,
} from "@/features/linkedin/utils/linkedin-analyzer-errors";
import Link from "next/link";

interface LinkedInAnalyzeErrorMessageProps {
  error: string;
  code?: LinkedInAnalyzerErrorCode;
  className?: string;
}

const LinkedInAnalyzeErrorMessage: React.FC<LinkedInAnalyzeErrorMessageProps> = ({ error, code, className = "" }) => {
  const message = linkedInAnalyzerErrorMessage(error, code);
  const showProfileLink = isLinkedInProfileUrlError(code);

  return (
    <p className={className}>
      {message}
      {showProfileLink ? (
        <>
          {" "}
          <Link href={LINKEDIN_PROFILE_SETTINGS_PATH} className="font-medium underline underline-offset-2">
            Update your profile settings
          </Link>{" "}
          to check or edit your LinkedIn URL.
        </>
      ) : null}
    </p>
  );
};

export default LinkedInAnalyzeErrorMessage;
