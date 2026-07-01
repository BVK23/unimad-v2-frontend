import MasterclassBookingGatePage from "@/components/masterclass/MasterclassBookingGatePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Unicoach | Unimad",
  description: "Your next step toward booking your discovery call.",
};

export default function MasterclassWelcomePage() {
  return <MasterclassBookingGatePage />;
}
