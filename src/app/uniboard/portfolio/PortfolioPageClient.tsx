"use client";

import { useState } from "react";
import Portfolio from "@/components/Portfolio";
import type { PortfolioData } from "@/types";

const NEW_PORTFOLIO_TEMPLATE: PortfolioData = {
  id: "",
  title: "My Portfolio",
  lastModified: new Date(),
  themeMode: "light",
  profile: {
    name: "Alex Morgan",
    email: "alex@unimad.dev",
    phone: "",
    location: "San Francisco, CA",
    bio: "",
    tagline: "Product Designer & Creative Technologist",
    website: "",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80",
    experience: [],
    education: [],
    layout: "standard",
    profileAlignment: "center",
    infoAlignment: "left",
    showAvatar: true,
    showCover: true,
  },
  items: [],
};

export default function PortfolioPageClient() {
  const [portfolio] = useState<PortfolioData>(() => ({
    ...NEW_PORTFOLIO_TEMPLATE,
    id: "portfolio-main",
  }));

  return <Portfolio initialData={portfolio} />;
}
