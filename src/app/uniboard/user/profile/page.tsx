import { ProfileSettingsPage } from "@/components/user-profile/ProfileSettingsPage";
import { UserSettingsLayout } from "@/components/user-profile/UserSettingsLayout";
import { fetchCurrentUserFlags } from "@/features/unicoach/server-actions/team-sales-actions";

export default async function UserProfilePage() {
  const flags = await fetchCurrentUserFlags();

  return (
    <UserSettingsLayout isTeamMember={flags.is_team_member}>
      <ProfileSettingsPage showTeamLink={flags.is_team_member} />
    </UserSettingsLayout>
  );
}
