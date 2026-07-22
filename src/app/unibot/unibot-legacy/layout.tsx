import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unibot legacy history | Unimad",
  robots: { index: false, follow: false },
};

/**
 * Standalone auth-gated shell — no Uniboard layout / ChatSidebar.
 * Intentionally unlisted; share URL only with users who need old home chats.
 */
export default async function UnibotLegacyLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) {
    redirect("/signin?from=" + encodeURIComponent("/unibot/unibot-legacy"));
  }

  return <>{children}</>;
}
