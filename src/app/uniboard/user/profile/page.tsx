import { ProfileSettingsPage } from "@/components/user-profile/ProfileSettingsPage";
import { UserSettingsLayout } from "@/components/user-profile/UserSettingsLayout";

export default function UserProfilePage() {
  return (
    <UserSettingsLayout>
      <ProfileSettingsPage />
    </UserSettingsLayout>
  );
}
