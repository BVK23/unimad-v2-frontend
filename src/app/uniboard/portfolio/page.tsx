import PortfolioPageClient from "./PortfolioPageClient";

export const metadata = {
  title: "Portfolio",
  description: "Your portfolio and profile",
};

export default async function PortfolioPage() {
  return <PortfolioPageClient />;
}
