"use client";

import { COACH_ACT_AS_HEADER, type CoachActAsSession } from "@/constants/coach-act-as";

type ClientAuthedFetchOptions = RequestInit & {
  accessToken: string;
  authScheme?: "Token" | "Bearer";
  coachActAs?: CoachActAsSession | null;
};

/** Browser fetch with optional coach act-as header (for client components / hooks). */
export async function clientAuthedFetch(
  backendUrl: string,
  path: string,
  { accessToken, authScheme = "Bearer", coachActAs, ...options }: ClientAuthedFetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `${authScheme} ${accessToken}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }
  if (coachActAs?.studentProfileId) {
    headers[COACH_ACT_AS_HEADER] = coachActAs.studentProfileId;
    console.info("[coach-act-as] clientAuthedFetch", {
      path,
      studentProfileId: coachActAs.studentProfileId,
    });
  }
  return fetch(`${backendUrl.replace(/\/+$/, "")}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}
