import { cookies } from "next/headers";
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
};

async function fetchUserData(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const accessTokenCookie = cookieStore.get("_ut");

    if (!accessTokenCookie?.value) {
      return null;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-data/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessTokenCookie.value}` },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as UserData;
    return data;
  } catch {
    return null;
  }
}

export default async function UniboardLayout({ children }: { children: React.ReactNode }) {
  const userData = await fetchUserData();

  if (userData?.onboarding_required) {
    redirect("/onboarding");
  }

  return <UniboardShell userData={userData}>{children}</UniboardShell>;
}
