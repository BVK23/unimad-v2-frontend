import { Suspense } from "react";
import MasterclassThanksForInterestPage from "@/components/masterclass/MasterclassThanksForInterestPage";

export const metadata = {
  title: "Thanks for Your Interest | Unimad",
  description: "We've saved your details. Come back when you're ready to book a discovery call.",
};

export default function MasterclassThanksForInterestRoute() {
  return (
    <Suspense fallback={null}>
      <MasterclassThanksForInterestPage />
    </Suspense>
  );
}
