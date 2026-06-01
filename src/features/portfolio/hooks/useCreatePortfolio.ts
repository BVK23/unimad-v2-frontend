"use client";

import { mapBackendPortfolioToFrontend } from "@/features/portfolio/api/mappers";
import type { PortfolioCreationVariant } from "@/features/portfolio/constants/portfolioCreationCopy";
import {
  createInitialPortfolio,
  createPortfolioFromBase,
  fetchPortfolioContent,
} from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import type { PortfolioData } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioQueryKey } from "./usePortfolio";

export type CreatePortfolioInput = {
  mode: "initial" | "from_base";
  with_ai_template?: boolean;
  clone_from_base?: boolean;
  name?: string;
};

const getVariantForInput = (input: CreatePortfolioInput): PortfolioCreationVariant => {
  if (input.mode === "from_base") {
    return input.clone_from_base ? "ai_clone" : "blank";
  }
  return input.with_ai_template === false ? "blank" : "ai_initial";
};

async function runCreatePortfolio(input: CreatePortfolioInput): Promise<PortfolioData> {
  try {
    const response =
      input.mode === "from_base"
        ? await createPortfolioFromBase({
            name: input.name,
            clone_from_base: input.clone_from_base ?? true,
          })
        : await createInitialPortfolio({
            with_ai_template: input.with_ai_template ?? true,
            ...(input.name ? { name: input.name } : {}),
          });

    return mapBackendPortfolioToFrontend(response.assetData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create portfolio";
    const alreadyExists = message.toLowerCase().includes("already exists") || message.toLowerCase().includes("portfolio already exists");

    if (alreadyExists) {
      const refetch = await fetchPortfolioContent();
      if (refetch.assetData) {
        return mapBackendPortfolioToFrontend(refetch.assetData);
      }
    }

    throw error;
  }
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runCreatePortfolio,
    onSuccess: portfolio => {
      queryClient.setQueryData(portfolioQueryKey, portfolio);
      if (portfolio.id) {
        usePortfolioStore.getState().setPortfolioData(portfolio.id, portfolio);
      }
    },
  });
}

export function getCreatePortfolioVariant(input: CreatePortfolioInput): PortfolioCreationVariant {
  return getVariantForInput(input);
}

export function buildCreateInputFromDashboardType(type: "scratch" | "template", hasBasePortfolio: boolean): CreatePortfolioInput {
  if (hasBasePortfolio) {
    return {
      mode: "from_base",
      clone_from_base: type === "template",
      name: type === "template" ? "New From Template" : "Blank Canvas",
    };
  }

  return {
    mode: "initial",
    with_ai_template: type === "template",
    name: type === "template" ? "Untitled Portfolio" : "Blank Canvas",
  };
}

export const defaultBootstrapCreateInput: CreatePortfolioInput = {
  mode: "initial",
  with_ai_template: true,
};
