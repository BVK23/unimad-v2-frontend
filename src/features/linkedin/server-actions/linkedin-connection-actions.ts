"use server";

import { extractConnectionMessageFromBotResponse } from "@/features/linkedin/api/extractConnectionMessage";
import { authedFetch } from "@/lib/authed-fetch";

function buildConnectUserMessage(name: string, designation: string): string {
  return `Recipient name: ${name}
Their designation / role: ${designation}

Do not ask me for more details. I want you to generate a connection request message for LinkedIn for this person.`;
}

export type GenerateLinkedInConnectionResult = {
  message: string;
  rawResponse: string;
};

/**
 * Calls Django `POST /api/unibot-api/` with section `connect`.
 */
export async function generateLinkedInConnectionRequest(params: {
  name: string;
  designation: string;
  regenerate?: boolean;
}): Promise<GenerateLinkedInConnectionResult> {
  const name = params.name.trim();
  const designation = params.designation.trim();
  if (!name || !designation) {
    throw new Error("Name and designation are required");
  }

  const userMessage = params.regenerate ? "Regenerate connection message" : buildConnectUserMessage(name, designation);

  const res = await authedFetch("/api/unibot-api/", {
    method: "POST",
    body: JSON.stringify({ message: userMessage, sectionName: "connect" }),
  });

  const data = (await res.json().catch(() => ({}))) as { response?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to generate connection request");
  }

  if (typeof data.response !== "string" || !data.response.trim()) {
    throw new Error("Invalid response from Unibot");
  }

  const extracted = extractConnectionMessageFromBotResponse(data.response);
  const message = extracted.trim() || data.response.trim();

  return { message, rawResponse: data.response };
}
