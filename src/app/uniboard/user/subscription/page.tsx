import { UserSettingsLayout } from "@/components/user-profile/UserSettingsLayout";
import { UserSubscriptionPanel } from "@/components/user-profile/UserSubscriptionPanel";

export default function UserSubscriptionPage() {
  return (
    <UserSettingsLayout>
      <UserSubscriptionPanel />
    </UserSettingsLayout>
  );
}
