import { NextResponse } from "next/server";

type ErrorJson = {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
};

export function createErrorResponse(error: string, statusCode: number = 500, details?: string): NextResponse<ErrorJson> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      statusCode,
    },
    { status: statusCode }
  );
}

export function createValidationError(message: string, details?: string): NextResponse<ErrorJson> {
  return createErrorResponse(message, 400, details);
}

export function createBackendConnectionError(
  deploymentType: "agent_engine" | "local_backend",
  statusCode: number,
  statusText: string,
  details?: string
): NextResponse<ErrorJson> {
  const message = `${deploymentType === "agent_engine" ? "Agent Engine" : "Local backend"} connection error: ${statusCode} ${statusText}`;

  let clientStatusCode: number;
  if (statusCode >= 500) {
    clientStatusCode = 502;
  } else if (statusCode === 401 || statusCode === 403) {
    clientStatusCode = statusCode;
  } else if (statusCode >= 400) {
    clientStatusCode = 400;
  } else {
    clientStatusCode = 502;
  }

  return createErrorResponse(message, clientStatusCode, details);
}

export function createStreamingError(
  deploymentType: "agent_engine" | "local_backend",
  error: Error | unknown,
  details?: string
): NextResponse<ErrorJson> {
  const message = `${deploymentType === "agent_engine" ? "Agent Engine" : "Local backend"} streaming error`;
  const errorDetails = details || (error instanceof Error ? error.message : "Unknown streaming error");

  console.error(message, error);

  return createErrorResponse(message, 500, errorDetails);
}

export function createInternalServerError(
  message: string = "Internal server error",
  error?: Error | unknown,
  details?: string
): NextResponse<ErrorJson> {
  console.error(message, error);
  const errorDetails = details || (error instanceof Error ? error.message : undefined);
  return createErrorResponse(message, 500, errorDetails);
}
