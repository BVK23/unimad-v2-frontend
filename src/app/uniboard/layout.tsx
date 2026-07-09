import { COACH_ACT_AS_COOKIE, COACH_ACT_AS_HEADER, COACH_ACT_AS_NAME_COOKIE } from "@/constants/coach-act-as";
import type { FeatureGates } from "@/features/onboarding/featureGates";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import UniboardShell from "./UniboardShell";

export const dynamic = "force-dynamic";

type UserData = {
  username?: string;
  name?: string;
  profilePictureUrl?: string;
  email?: string;
  firstName?: string;
  is_team_member?: boolean;
  onboarding_required?: boolean;
  profile_setup_required?: boolean;
  onboarded_at?: string | null;
  minimal_onboarded_at?: string | null;
  feature_gates?: FeatureGates;
  is_coach_acting_as_student?: boolean;
  viewing_student_profile_id?: number;
  coach_actor?: {
    email?: string;
    name?: string;
    profilePictureUrl?: string | null;
  };
};

async function fetchUserData(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const accessTokenCookie = cookieStore.get("_ut");

    if (!accessTokenCookie?.value) {
      return null;
    }

    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessTokenCookie.value}`,
    };
    const actAsId = cookieStore.get(COACH_ACT_AS_COOKIE)?.value?.trim();
    if (actAsId && /^\d+$/.test(actAsId)) {
      requestHeaders[COACH_ACT_AS_HEADER] = actAsId;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-data/`, {
      method: "GET",
      headers: requestHeaders,
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as UserData;
  } catch {
    return null;
  }
}

export default async function UniboardLayout({ children }: { children: React.ReactNode }) {
  const userData = await fetchUserData();
  const cookieStore = await cookies();
  const actAsId = cookieStore.get(COACH_ACT_AS_COOKIE)?.value?.trim();
  const actAsNameRaw = cookieStore.get(COACH_ACT_AS_NAME_COOKIE)?.value;
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const coachActAsSession =
    actAsId && /^\d+$/.test(actAsId)
      ? {
          studentProfileId: actAsId,
          studentDisplayName: decodeURIComponent(actAsNameRaw?.trim() || userData?.firstName || userData?.name || "Student"),
        }
      : null;

  if (userData?.onboarding_required && !coachActAsSession && !pathname.startsWith("/uniboard/onboarding")) {
    redirect("/uniboard/onboarding");
  }

  return (
    <UniboardShell userData={userData} coachActAsSession={coachActAsSession}>
      {children}
    </UniboardShell>
  );
}
