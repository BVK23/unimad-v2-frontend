"use server";

import { extractConnectionMessageFromBotResponse } from "@/features/linkedin/api/extractConnectionMessage";
import { cookies } from "next/headers";

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) {
    throw new Error("Unauthorized");
  }
  return {
    token: cookieToken,
    scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token",
  };
}

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

  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();

  const res = await fetch(`${backendUrl}/api/unibot-api/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
    },
    body: JSON.stringify({ message: userMessage, sectionName: "connect" }),
    cache: "no-store",
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
