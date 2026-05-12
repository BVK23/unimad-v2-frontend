import OnboardingChrome from "@/components/onboarding/OnboardingChrome";
import ToastProvider from "@/components/onboarding/shared/Toast";

export const metadata = {
  title: "Onboarding",
  description: "Tell Unibot about you to personalise your toolkit.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <OnboardingChrome>{children}</OnboardingChrome>
    </ToastProvider>
  );
}
