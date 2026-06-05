import ToastProvider from "@/components/onboarding/shared/Toast";
import { TeamInternalPage } from "@/components/unicoach/team/TeamInternalPage";
import { fetchCurrentUserFlags } from "@/features/unicoach/server-actions/team-sales-actions";
import { redirect } from "next/navigation";

export default async function TeamDashboardPage() {
  const flags = await fetchCurrentUserFlags();
  if (!flags.is_team_member) {
    redirect("/uniboard/resume");
  }

  return (
    <ToastProvider>
      <TeamInternalPage />
    </ToastProvider>
  );
}
