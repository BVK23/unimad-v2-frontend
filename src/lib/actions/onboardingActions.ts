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

export type OnboardingUserState = "NEW_USER" | "RETURNING_USER" | "EXISTING_USER" | "MINIMAL_COMPLETE" | "COMPLETED";

function isProfileSetupComplete(checkpoints: OnboardingCheckpoints): boolean {
  const { preferred_name, education, experience, project, skill, role } = checkpoints;
  return Boolean(preferred_name && education && skill && role && (experience || project));
}

/** Compute high-level user state from checkpoints (matches v1 logic). */
export const getUserOnboardingState = async (checkpoints: OnboardingCheckpoints): Promise<OnboardingUserState> => {
  const { preferred_name, education, experience, project, skill, role, phone_number, linkedin_url, goal } = checkpoints;

  const profileComplete = isProfileSetupComplete(checkpoints);

  // Minimal onboarding (phone + LinkedIn) unlocks Uniboard access.
  if (phone_number && linkedin_url) {
    return profileComplete ? "COMPLETED" : "MINIMAL_COMPLETE";
  }

  if (!preferred_name && !education && !experience && !project && !skill && !role && !phone_number && !linkedin_url && !goal) {
    return "NEW_USER";
  }

  // Existing-user heuristic (mirrors v1): main steps done and only one of phone/linkedin/goal pending
  const mainStepsComplete = preferred_name && education && skill && role && (experience || project);
  const filledFinalCount = [phone_number, linkedin_url, goal].filter(Boolean).length;
  if (mainStepsComplete && filledFinalCount === 2) return "EXISTING_USER";

  return "RETURNING_USER";
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

async function getAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut");
  return token?.value ?? null;
}

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

/** Server-side helper: redirect when phone or LinkedIn are missing. */
export async function getMinimalOnboardingGateState(): Promise<
  { kind: "unauthenticated" } | { kind: "complete" } | { kind: "incomplete"; userState: OnboardingUserState }
> {
  const accessToken = await getAccessToken();
  if (!accessToken) return { kind: "unauthenticated" };

  try {
    const checkpoints = await fetchOnboardingCheckpoints();
    if (checkpoints.phone_number && checkpoints.linkedin_url) return { kind: "complete" };
    const userState = await getUserOnboardingState(checkpoints);
    return { kind: "incomplete", userState };
  } catch {
    return { kind: "complete" };
  }
}

/** @deprecated Use getMinimalOnboardingGateState for layout gates. Profile gating uses profile_setup_required from user-data. */
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
