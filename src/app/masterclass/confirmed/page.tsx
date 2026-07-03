import { Suspense } from "react";
import MasterclassConfirmedPage from "@/components/masterclass/MasterclassConfirmedPage";

export const metadata = {
  title: "Discovery Call Confirmed | Unimad",
  description: "Your discovery call is booked. Sign in to Unimad to get ready.",
};

export default function MasterclassConfirmedRoute() {
  return (
    <Suspense fallback={null}>
      <MasterclassConfirmedPage />
    </Suspense>
  );
}
