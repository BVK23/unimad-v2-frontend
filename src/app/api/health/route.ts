import { getEndpointForPath, getAuthHeaders } from "@/src/features/adk-chat/config";
import { NextRequest, NextResponse } from "next/server";

/**
 * ADK `api_server` (google-adk) does not expose GET /health.
 * It does expose GET /list-apps (see google.adk.cli.fast_api), which is a cheap liveness check.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const backendDocsUrl = getEndpointForPath("/list-apps");
    const authHeaders = await getAuthHeaders();

    const response = await fetch(backendDocsUrl, {
      method: "GET",
      headers: {
        ...authHeaders,
        "User-Agent": request.headers.get("User-Agent") || "ADK-Health-Check",
        Accept: request.headers.get("Accept") || "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Backend health check failed:", error);

    return NextResponse.json(
      {
        error: "Backend service unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
