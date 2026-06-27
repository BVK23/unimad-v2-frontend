import { proxyRunSseFromRequest, runSseOptionsResponse } from "@/src/lib/adk/run-sse-app-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    return await proxyRunSseFromRequest(req);
  } catch (error) {
    console.error("run_sse app route error:", error);
    return Response.json({ error: "Failed to process streaming request" }, { status: 500 });
  }
}

export async function OPTIONS(): Promise<Response> {
  return runSseOptionsResponse();
}
