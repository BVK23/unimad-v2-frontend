import type { ContactButton, UserProfile } from "@/types";

export const WEBSITE_CONTACT_BUTTON_ID = "contact-site";
export const DEFAULT_WEBSITE_BUTTON_LABEL = "Website";

const isWebsiteContactButton = (button: ContactButton): boolean => button.id === WEBSITE_CONTACT_BUTTON_ID;

const findWebsiteButtonIndex = (buttons: ContactButton[]): number => buttons.findIndex(isWebsiteContactButton);

const syncWebsiteContactButton = (profile: UserProfile): UserProfile => {
  const website = profile.website?.trim() ?? "";
  const label = profile.websiteLabel?.trim() || DEFAULT_WEBSITE_BUTTON_LABEL;
  const buttons = [...(profile.contactButtons ?? [])];
  const index = findWebsiteButtonIndex(buttons);

  if (!website) {
    const nextButtons = index >= 0 ? buttons.filter((_, i) => i !== index) : buttons;
    return { ...profile, website: "", websiteLabel: "", contactButtons: nextButtons };
  }

  const existing = index >= 0 ? buttons[index] : undefined;
  const chip: ContactButton = {
    id: existing?.id ?? WEBSITE_CONTACT_BUTTON_ID,
    label,
    url: website,
    icon: "link",
    isVisible: existing?.isVisible ?? true,
  };

  if (index >= 0) {
    buttons[index] = chip;
  } else {
    buttons.push(chip);
  }

  return { ...profile, website, websiteLabel: label, contactButtons: buttons };
};

/** Align profile.website / websiteLabel with the primary Website link chip (id contact-site). */
export const reconcileProfileWebsite = (profile: UserProfile): UserProfile => {
  const website = profile.website?.trim() ?? "";
  if (website) {
    return syncWebsiteContactButton(profile);
  }

  const chip = profile.contactButtons?.find(isWebsiteContactButton);
  const chipUrl = chip?.url?.trim() ?? "";
  if (chipUrl) {
    const chipLabel = chip?.label?.trim() || DEFAULT_WEBSITE_BUTTON_LABEL;
    return syncWebsiteContactButton({ ...profile, website: chipUrl, websiteLabel: chipLabel });
  }

  return syncWebsiteContactButton(profile);
};
