export const AUTH_ERRORS = {
  NO_COOKIES: {
    code: "authentication_required",
    message: "Please sign in to continue using the application",
  },
  SESSION_EXPIRED: {
    code: "session_expired",
    message: "Your session has expired. Please log in again",
  },
  INVALID_TOKEN: {
    code: "invalid_token",
    message: "Clear your cookies and try again",
  },
  ACCESS_DENIED: {
    code: "access_denied",
    message: "You do not have permission to access this resource",
  },
} as const;
