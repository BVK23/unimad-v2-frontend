import type { ContactButton, UserProfile } from "@/types";

const isLocationContactButton = (button: ContactButton): boolean => button.icon === "location" || button.id === "contact-location";

const buildLocationMapsUrl = (location: string): string => {
  const trimmed = location.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};

const findLocationButtonIndex = (buttons: ContactButton[]): number => buttons.findIndex(isLocationContactButton);

const syncLocationContactButton = (profile: UserProfile): UserProfile => {
  const loc = profile.location?.trim() ?? "";
  const buttons = [...(profile.contactButtons ?? [])];
  const index = findLocationButtonIndex(buttons);

  if (!loc) {
    const nextButtons = index >= 0 ? buttons.filter((_, i) => i !== index) : buttons;
    return { ...profile, location: "", contactButtons: nextButtons };
  }

  const mapUrl = buildLocationMapsUrl(loc);
  const existing = index >= 0 ? buttons[index] : undefined;
  const chip: ContactButton = {
    id: existing?.id ?? "contact-location",
    label: loc,
    url: mapUrl,
    icon: "location",
    isVisible: existing?.isVisible ?? true,
  };

  if (index >= 0) {
    buttons[index] = chip;
  } else {
    buttons.push(chip);
  }

  return { ...profile, location: loc, contactButtons: buttons };
};

/** Align profile.location and the location contact chip (profile.location wins when set). */
export const reconcileProfileLocation = (profile: UserProfile): UserProfile => {
  const loc = profile.location?.trim() ?? "";
  if (loc) {
    return syncLocationContactButton(profile);
  }

  const chip = profile.contactButtons?.find(isLocationContactButton);
  const chipLabel = chip?.label?.trim() ?? "";
  if (chipLabel) {
    return syncLocationContactButton({ ...profile, location: chipLabel });
  }

  return syncLocationContactButton(profile);
};
