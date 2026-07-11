import { NEW_PORTFOLIO_DRAFT_ID } from "@/features/portfolio/constants/portfolioDraft";
import type { PortfolioData } from "@/types";

type ScratchPortfolioInput = {
  name?: string | null;
  email?: string | null;
};

/** Local-only blank portfolio prefilled from authenticated user profile data. */
export function buildScratchPortfolio({ name, email }: ScratchPortfolioInput): PortfolioData {
  const displayName = name?.trim() || "Untitled Portfolio";
  const displayEmail = email?.trim() || "";

  return {
    id: NEW_PORTFOLIO_DRAFT_ID,
    title: displayName,
    lastModified: new Date(),
    profile: {
      name: displayName,
      tagline: "",
      bio: "",
      location: "",
      email: displayEmail,
      phone: "",
      website: "",
      avatarUrl: "",
      coverUrl: "",
      layout: "centered",
      experience: [],
      education: [],
      showAvatar: true,
      showCover: true,
      showProfileSection: true,
      contactButtons: displayEmail
        ? [
            {
              id: "contact-email",
              label: displayEmail,
              url: displayEmail,
              icon: "mail",
              isVisible: true,
            },
          ]
        : [],
    },
    items: [],
  };
}
