import { MASTERCLASS_WELCOME_PATH } from "@/constants/masterclass";
import { redirect } from "next/navigation";

export default function MasterclassBookingRedirectPage() {
  redirect(MASTERCLASS_WELCOME_PATH);
}
