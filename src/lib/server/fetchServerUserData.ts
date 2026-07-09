import { COACH_ACT_AS_COOKIE, COACH_ACT_AS_HEADER } from "@/constants/coach-act-as";
import type { FeatureGates } from "@/features/onboarding/featureGates";
import { cookies } from "next/headers";

export type ServerUserData = {
  onboarding_required?: boolean;
  profile_setup_required?: boolean;
  onboarded_at?: string | null;
  minimal_onboarded_at?: string | null;
  feature_gates?: FeatureGates;
};

/** Server-side fetch of /api/user-data/ for layout and onboarding redirects. */
export async function fetchServerUserData(): Promise<ServerUserData | null> {
  try {
    const cookieStore = await cookies();
    const accessTokenCookie = cookieStore.get("_ut");

    if (!accessTokenCookie?.value) {
      return null;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessTokenCookie.value}`,
    };
    const actAsId = cookieStore.get(COACH_ACT_AS_COOKIE)?.value?.trim();
    if (actAsId && /^\d+$/.test(actAsId)) {
      headers[COACH_ACT_AS_HEADER] = actAsId;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-data/`, {
      method: "GET",
      headers,
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as ServerUserData;
  } catch {
    return null;
  }
}
