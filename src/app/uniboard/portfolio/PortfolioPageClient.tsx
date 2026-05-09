"use client";

import { useEffect, useMemo, useState } from "react";
import Portfolio from "@/components/Portfolio";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import { usePortfolio } from "@/features/portfolio/hooks/usePortfolio";
import { useUpdatePortfolio } from "@/features/portfolio/hooks/useUpdatePortfolio";
import { createInitialPortfolio } from "@/features/portfolio/server-actions/portfolio-actions";
import type { PortfolioData } from "@/types";

const NEW_PORTFOLIO_TEMPLATE: PortfolioData = {
  id: "",
  title: "Untitled Portfolio",
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
    coverUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80",
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
  const [view, setView] = useState<"list" | "editor">("editor");
  const [currentPortfolio, setCurrentPortfolio] = useState<PortfolioData | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const portfolioQuery = usePortfolio();
  const updatePortfolioMutation = useUpdatePortfolio();

  useEffect(() => {
    if (!portfolioQuery.data) {
      return;
    }

    setCurrentPortfolio(portfolioQuery.data);
  }, [portfolioQuery.data]);

  useEffect(() => {
    if (portfolioQuery.isLoading || portfolioQuery.data || isBootstrapping) {
      return;
    }

    let cancelled = false;

    const bootstrapPortfolio = async () => {
      setIsBootstrapping(true);
      setBootstrapError(null);

      try {
        const response = await createInitialPortfolio();
        if (cancelled) {
          return;
        }

        const portfolio = mapBackendPortfolioToFrontend(response.assetData);
        setCurrentPortfolio(portfolio);
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : "Failed to create portfolio");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrapPortfolio();

    return () => {
      cancelled = true;
    };
  }, [isBootstrapping, portfolioQuery.data, portfolioQuery.isLoading]);

  const portfolios = useMemo(() => (currentPortfolio ? [currentPortfolio] : []), [currentPortfolio]);

  const handleEditPortfolio = (portfolio: PortfolioData) => {
    setCurrentPortfolio(portfolio);
    setView("editor");
  };

  const handleSavePortfolio = async (portfolio: PortfolioData) => {
    const savedPortfolio = await updatePortfolioMutation.mutateAsync(portfolio);
    setCurrentPortfolio(savedPortfolio);
  };

  const handleCreatePortfolio = async (type: "scratch" | "template") => {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const response = await createInitialPortfolio({
        with_ai_template: type === "template",
        name: type === "template" ? "New From Template" : "Blank Canvas",
      });
      const portfolio = mapBackendPortfolioToFrontend(response.assetData);
      setCurrentPortfolio(portfolio);
      setView("editor");
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Failed to create portfolio");
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (portfolioQuery.isLoading || isBootstrapping) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading portfolio...</div>;
  }

  if (bootstrapError) {
    return <div className="flex h-full items-center justify-center text-sm text-red-600">{bootstrapError}</div>;
  }

  if (view === "list") {
    return <PortfolioDashboard portfolios={portfolios} onEditPortfolio={handleEditPortfolio} onCreatePortfolio={handleCreatePortfolio} />;
  }

  if (currentPortfolio) {
    const editorKey = `${currentPortfolio.id}-${currentPortfolio.lastModified instanceof Date ? currentPortfolio.lastModified.getTime() : 0}`;

    return (
      <Portfolio
        key={editorKey}
        initialData={currentPortfolio}
        onBack={() => setView("list")}
        onSave={handleSavePortfolio}
        isSaving={updatePortfolioMutation.isPending}
        saveError={updatePortfolioMutation.error instanceof Error ? updatePortfolioMutation.error.message : null}
      />
    );
  }

  return (
    <Portfolio
      key="new-portfolio-template"
      initialData={{
        ...NEW_PORTFOLIO_TEMPLATE,
        id: `starter-${Date.now()}`,
        title: "Visual Draft",
      }}
      onBack={() => setView("list")}
    />
  );
}
