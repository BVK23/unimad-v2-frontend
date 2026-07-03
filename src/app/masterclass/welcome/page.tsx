import { MASTERCLASS_CONFIRMED_PATH } from "@/constants/masterclass";
import { redirect } from "next/navigation";

export default function MasterclassWelcomeRedirectPage() {
  redirect(MASTERCLASS_CONFIRMED_PATH);
}
