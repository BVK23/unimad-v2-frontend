import MasterclassLandingPage from "@/components/masterclass/MasterclassLandingPage";

export const metadata = {
  title: "Unimad Career Positioning System | Masterclass",
  description:
    "Watch the masterclass, explore pricing, and start with a free discovery call. The system 5000+ international students used to land interviews.",
  openGraph: {
    title: "Unimad Career Positioning System | Masterclass",
    description:
      "Watch the masterclass, explore pricing, and start with a free discovery call. The system 5000+ international students used to land interviews.",
    type: "website",
    url: "https://unimad.ai/masterclass/organic",
  },
  alternates: {
    canonical: "/masterclass/organic",
  },
};

export default function MasterclassOrganicPage() {
  return <MasterclassLandingPage variant="organic" />;
}
