import { shouldUseAgentEngine } from "@/src/features/adk-chat/config";
import { createValidationError, createInternalServerError } from "@/src/lib/adk/error-utils";
import { handleAgentEngineStreamRequest } from "@/src/lib/adk/run-sse-agent-engine-handler";
import { parseStreamRequest, logStreamRequest, CORS_HEADERS } from "@/src/lib/adk/run-sse-common";
import { handleLocalBackendStreamRequest } from "@/src/lib/adk/run-sse-local-backend-handler";
import { NextRequest } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { data: requestData, validation } = await parseStreamRequest(request);

    if (!validation.isValid || !requestData) {
      return createValidationError(validation.error || "Invalid request format");
    }

    const deploymentType = shouldUseAgentEngine() ? "agent_engine" : "local_backend";

    logStreamRequest(requestData.sessionId, requestData.userId, requestData.message, deploymentType);

    if (deploymentType === "agent_engine") {
      return await handleAgentEngineStreamRequest(requestData);
    }
    return await handleLocalBackendStreamRequest(requestData);
  } catch (error) {
    return createInternalServerError("Failed to process streaming request", error);
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
