import { MASTERCLASS_CONFIRMED_PATH } from "@/constants/masterclass";
import { redirect } from "next/navigation";

export default function MasterclassBookingRedirectPage() {
  redirect(MASTERCLASS_CONFIRMED_PATH);
}
