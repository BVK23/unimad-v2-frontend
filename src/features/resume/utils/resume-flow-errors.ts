import { messageFromFailedResponse, sanitizeUserFacingError } from "@/utils/message-from-failed-response";

/** Stable codes users can share with support (also returned by the API when available). */
export const RESUME_FLOW_ERROR_CODES = {
  RESUME_UPLOAD_MISSING: "RESUME_UPLOAD_MISSING",
  RESUME_UPLOAD_INVALID_TYPE: "RESUME_UPLOAD_INVALID_TYPE",
  RESUME_UPLOAD_TOO_LARGE: "RESUME_UPLOAD_TOO_LARGE",
  RESUME_EXTRACT_EMPTY: "RESUME_EXTRACT_EMPTY",
  RESUME_EXTRACT_NO_SECTIONS: "RESUME_EXTRACT_NO_SECTIONS",
  RESUME_EXTRACT_UNAVAILABLE: "RESUME_EXTRACT_UNAVAILABLE",
  RESUME_EXTRACT_FAILED: "RESUME_EXTRACT_FAILED",
  RESUME_GENERATE_FAILED: "RESUME_GENERATE_FAILED",
  RESUME_GENERATE_LLM_FAILED: "RESUME_GENERATE_LLM_FAILED",
  RESUME_GENERATE_PARSE_FAILED: "RESUME_GENERATE_PARSE_FAILED",
  RESUME_GENERATE_TAILOR_FAILED: "RESUME_GENERATE_TAILOR_FAILED",
  RESUME_GENERATE_NO_ID: "RESUME_GENERATE_NO_ID",
  RESUME_DUPLICATE: "RESUME_DUPLICATE",
  RESUME_APPLICATION_NOT_FOUND: "RESUME_APPLICATION_NOT_FOUND",
  RESUME_JD_INCOMPLETE: "RESUME_JD_INCOMPLETE",
  RESUME_UNAUTHORIZED: "RESUME_UNAUTHORIZED",
  RESUME_RATE_LIMITED: "RESUME_RATE_LIMITED",
  RESUME_PLUS_REQUIRED: "RESUME_PLUS_REQUIRED",
  RESUME_NETWORK_ERROR: "RESUME_NETWORK_ERROR",
  RESUME_UNKNOWN: "RESUME_UNKNOWN",
} as const;

export type ResumeFlowErrorCode = (typeof RESUME_FLOW_ERROR_CODES)[keyof typeof RESUME_FLOW_ERROR_CODES];

export type ResumeFlowError = {
  code: ResumeFlowErrorCode;
  message: string;
};

type ApiErrorBody = {
  error?: unknown;
  message?: unknown;
  error_code?: unknown;
};

const KNOWN_CODES = new Set<string>(Object.values(RESUME_FLOW_ERROR_CODES));

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isKnownCode(value: string): value is ResumeFlowErrorCode {
  return KNOWN_CODES.has(value);
}

const USER_MESSAGES: Record<ResumeFlowErrorCode, string> = {
  RESUME_UPLOAD_MISSING: "Choose a PDF resume file to upload.",
  RESUME_UPLOAD_INVALID_TYPE: "Only PDF files are supported. Export your resume as a PDF and try again.",
  RESUME_UPLOAD_TOO_LARGE: "That file is too large. Please upload a PDF up to 5 MB.",
  RESUME_EXTRACT_EMPTY: "We couldn't read any resume sections from that PDF. Try a text-based PDF or create a resume from scratch.",
  RESUME_EXTRACT_NO_SECTIONS:
    "We couldn't find usable experience, education, skills, or projects in that PDF. Try another file or start fresh.",
  RESUME_EXTRACT_UNAVAILABLE: "Resume reading is temporarily busy. Wait a minute and try again.",
  RESUME_EXTRACT_FAILED: "We couldn't process that PDF right now. Please try again.",
  RESUME_GENERATE_FAILED: "We couldn't finish creating your resume. Please try again.",
  RESUME_GENERATE_LLM_FAILED: "Our AI couldn't complete your resume this time. Please try again.",
  RESUME_GENERATE_PARSE_FAILED: "We received an unexpected response while building your resume. Please try again.",
  RESUME_GENERATE_TAILOR_FAILED: "We couldn't tailor your resume for that job. Please try again.",
  RESUME_GENERATE_NO_ID: "Your resume was created but we couldn't open it. Refresh the page and check your resume list.",
  RESUME_DUPLICATE: "A resume already exists for this job application.",
  RESUME_APPLICATION_NOT_FOUND: "That job application could not be found. Refresh and try again.",
  RESUME_JD_INCOMPLETE: "Please fill company, role, and a job description (at least 10 characters).",
  RESUME_UNAUTHORIZED: "Your session expired. Sign in again and retry.",
  RESUME_RATE_LIMITED: "Our AI service is busy right now. Wait a moment and try again.",
  RESUME_PLUS_REQUIRED: "You've reached the free resume limit. Upgrade to Unimad Plus to create more.",
  RESUME_NETWORK_ERROR: "We couldn't reach the server. Check your connection and try again.",
  RESUME_UNKNOWN: "Something went wrong. Please try again.",
};

export function resumeFlowErrorMessage(code: ResumeFlowErrorCode, fallback?: string): string {
  return fallback?.trim() || USER_MESSAGES[code] || USER_MESSAGES.RESUME_UNKNOWN;
}

export function mapExtractResumeFailure(status: number, body: ApiErrorBody, bodyText = ""): ResumeFlowError {
  const apiCode = asTrimmedString(body.error_code);
  if (isKnownCode(apiCode)) {
    const apiMessage = asTrimmedString(body.message) || asTrimmedString(body.error);
    return {
      code: apiCode,
      message: resumeFlowErrorMessage(apiCode, sanitizeUserFacingError(apiMessage, USER_MESSAGES[apiCode])),
    };
  }

  if (status === 401 || status === 403) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_UNAUTHORIZED, message: USER_MESSAGES.RESUME_UNAUTHORIZED };
  }
  if (status === 503) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_UNAVAILABLE, message: USER_MESSAGES.RESUME_EXTRACT_UNAVAILABLE };
  }
  if (status === 429) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_RATE_LIMITED, message: USER_MESSAGES.RESUME_RATE_LIMITED };
  }
  if (status === 400) {
    const raw = asTrimmedString(body.error) || asTrimmedString(body.message);
    if (/pdf/i.test(raw)) {
      return { code: RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_INVALID_TYPE, message: USER_MESSAGES.RESUME_UPLOAD_INVALID_TYPE };
    }
    if (/no resume file/i.test(raw)) {
      return { code: RESUME_FLOW_ERROR_CODES.RESUME_UPLOAD_MISSING, message: USER_MESSAGES.RESUME_UPLOAD_MISSING };
    }
  }

  const safeMessage = messageFromFailedResponse(status, bodyText, asTrimmedString(body.error) || asTrimmedString(body.message));
  return {
    code: RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_FAILED,
    message: sanitizeUserFacingError(safeMessage, USER_MESSAGES.RESUME_EXTRACT_FAILED),
  };
}

export function mapGenerateResumeFailure(status: number, body: ApiErrorBody, bodyText = ""): ResumeFlowError {
  const apiCode = asTrimmedString(body.error_code);
  if (isKnownCode(apiCode)) {
    const apiMessage = asTrimmedString(body.message) || asTrimmedString(body.error);
    return {
      code: apiCode,
      message: resumeFlowErrorMessage(apiCode, sanitizeUserFacingError(apiMessage, USER_MESSAGES[apiCode])),
    };
  }

  if (status === 409) {
    const duplicateMessage = asTrimmedString(body.message) || USER_MESSAGES.RESUME_DUPLICATE;
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_DUPLICATE, message: duplicateMessage };
  }
  if (status === 401 || status === 403) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_UNAUTHORIZED, message: USER_MESSAGES.RESUME_UNAUTHORIZED };
  }
  if (status === 402 || asTrimmedString(body.error_code) === "NOT_A_PLUS_MEMBER") {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_PLUS_REQUIRED, message: USER_MESSAGES.RESUME_PLUS_REQUIRED };
  }
  if (status === 503 || /limit reached|try again later/i.test(asTrimmedString(body.error))) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_RATE_LIMITED, message: USER_MESSAGES.RESUME_RATE_LIMITED };
  }
  if (status === 429) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_RATE_LIMITED, message: USER_MESSAGES.RESUME_RATE_LIMITED };
  }
  if (/unable to extract resume data|invalid json format/i.test(asTrimmedString(body.error))) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_PARSE_FAILED, message: USER_MESSAGES.RESUME_GENERATE_PARSE_FAILED };
  }
  if (/tailored|sections/i.test(asTrimmedString(body.error))) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_TAILOR_FAILED, message: USER_MESSAGES.RESUME_GENERATE_TAILOR_FAILED };
  }
  if (/unibot|internal server error/i.test(asTrimmedString(body.error))) {
    return { code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_LLM_FAILED, message: USER_MESSAGES.RESUME_GENERATE_LLM_FAILED };
  }

  const safeMessage = messageFromFailedResponse(status, bodyText, asTrimmedString(body.error) || asTrimmedString(body.message));
  return {
    code: RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_FAILED,
    message: sanitizeUserFacingError(safeMessage, USER_MESSAGES.RESUME_GENERATE_FAILED),
  };
}

export function mapResumeActionCatchError(err: unknown, stage: "extract" | "generate"): ResumeFlowError {
  if (err instanceof Error) {
    if (err.message === "Unauthorized") {
      return { code: RESUME_FLOW_ERROR_CODES.RESUME_UNAUTHORIZED, message: USER_MESSAGES.RESUME_UNAUTHORIZED };
    }
    const sanitized = sanitizeUserFacingError(err.message);
    if (sanitized !== err.message.trim()) {
      return {
        code: stage === "extract" ? RESUME_FLOW_ERROR_CODES.RESUME_EXTRACT_FAILED : RESUME_FLOW_ERROR_CODES.RESUME_GENERATE_FAILED,
        message: sanitized,
      };
    }
  }

  return {
    code: RESUME_FLOW_ERROR_CODES.RESUME_NETWORK_ERROR,
    message: USER_MESSAGES.RESUME_NETWORK_ERROR,
  };
}
