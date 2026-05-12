"use server";

import { cookies } from "next/headers";

export type OnboardingCheckpoints = {
  name: string;
  preferred_name: string;
  education: boolean;
  experience: boolean;
  project: boolean;
  skill: boolean;
  role: boolean;
  phone_number: boolean;
  linkedin_url: boolean;
  goal: boolean;
};

export type OnboardingUserState = "NEW_USER" | "RETURNING_USER" | "EXISTING_USER" | "COMPLETED";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

async function getAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut");
  return token?.value ?? null;
}

/** Compute high-level user state from checkpoints (matches v1 logic). */
export const getUserOnboardingState = async (checkpoints: OnboardingCheckpoints): Promise<OnboardingUserState> => {
  const { preferred_name, education, experience, project, skill, role, phone_number, linkedin_url, goal } = checkpoints;

  if (!preferred_name && !education && !experience && !project && !skill && !role && !phone_number && !linkedin_url && !goal) {
    return "NEW_USER";
  }

  const isOnboardingComplete =
    preferred_name && education && skill && role && (experience || project) && phone_number && linkedin_url && goal;

  if (isOnboardingComplete) return "COMPLETED";

  // Existing-user heuristic (mirrors v1): main steps done and only one of phone/linkedin/goal pending
  const mainStepsComplete = preferred_name && education && skill && role && (experience || project);
  const filledFinalCount = [phone_number, linkedin_url, goal].filter(Boolean).length;
  if (mainStepsComplete && filledFinalCount === 2) return "EXISTING_USER";

  return "RETURNING_USER";
};

export async function fetchOnboardingCheckpoints(): Promise<OnboardingCheckpoints> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Unauthorized");

  const response = await fetch(`${BACKEND_URL}/api/onboarding/checkpoints`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to load onboarding check data";
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as OnboardingCheckpoints;
}

/** Server-side helper used by route gates (e.g. /uniboard/resume) to redirect when onboarding is incomplete. */
export async function getOnboardingGateState(): Promise<
  { kind: "unauthenticated" } | { kind: "complete" } | { kind: "incomplete"; userState: OnboardingUserState }
> {
  const accessToken = await getAccessToken();
  if (!accessToken) return { kind: "unauthenticated" };

  try {
    const checkpoints = await fetchOnboardingCheckpoints();
    const userState = await getUserOnboardingState(checkpoints);
    if (userState === "COMPLETED") return { kind: "complete" };
    return { kind: "incomplete", userState };
  } catch {
    // On backend hiccup we fail-open and let the page render rather than send the user in circles.
    return { kind: "complete" };
  }
}

export async function extractResume(formData: FormData) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Unauthorized");

  const response = await fetch(`${BACKEND_URL}/api/extract-resume-data/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to extract resume");
  return await response.json();
}

export type SuggestionType =
  | "onboarding_skill"
  | "onboarding_desired_role"
  | "onboarding_education"
  | "onboarding_experience"
  | "onboarding_project";

export const getSuggestions = async (sectionName: SuggestionType, input: Record<string, unknown> = {}): Promise<{ data: string[] }> => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Unauthorized");

  const response = await fetch(`${BACKEND_URL}/api/onboarding/suggestions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      section_name: sectionName,
      ...input,
    }),
  });

  if (!response.ok) {
    let message = "Internal server error";
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as { data: string[] };
};

export type OnboardingSaveType =
  | "preferred_name"
  | "educations"
  | "experiences"
  | "projects"
  | "skills"
  | "desired_roles"
  | "whatsapp"
  | "linkedin_url"
  | "goal";

export const saveOnboardingData = async (type: OnboardingSaveType, data: Record<string, unknown>) => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Unauthorized");

  const response = await fetch(`${BACKEND_URL}/api/onboarding/save-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, ...data }),
  });

  if (!response.ok) {
    let message = "Internal server error";
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return await response.json();
};
