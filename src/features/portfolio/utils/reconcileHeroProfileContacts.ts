import { reconcileProfileLocation } from "@/features/portfolio/utils/syncProfileLocation";
import { reconcileProfileWebsite } from "@/features/portfolio/utils/syncProfileWebsite";
import type { UserProfile } from "@/types";

export const reconcileHeroProfileContacts = (profile: UserProfile): UserProfile =>
  reconcileProfileWebsite(reconcileProfileLocation(profile));
