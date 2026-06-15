"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSelectionSuggestions } from "@/features/application-assets/api/fetchSelectionSuggestions";
import {
  APPLICATION_ASSET_MIN_SELECTION_CHARS,
  APPLICATION_ASSET_SELECTION_PRESETS,
} from "@/features/application-assets/config/selection-presets";
import type { ApplicationAssetApiType, SelectionSuggestion } from "@/features/application-assets/types";

export type SelectionSuggestionsStatus = "idle" | "loading" | "success" | "fallback";

export type UseSelectionSuggestionsInput = {
  assetType: ApplicationAssetApiType;
  assetId: string | null;
  selectedText: string;
  documentBody: string;
  role: string;
  company: string;
  jobDescription: string;
  contactName: string;
  enabled?: boolean;
};

export type UseSelectionSuggestionsResult = {
  suggestions: SelectionSuggestion[];
  status: SelectionSuggestionsStatus;
};

const suggestionCache = new Map<string, SelectionSuggestion[]>();

const buildCacheKey = (assetId: string | null, selectedText: string): string => {
  const scope = assetId ?? "draft";
  return `${scope}:${selectedText.trim().toLowerCase()}`;
};

const toFallbackSuggestions = (assetType: ApplicationAssetApiType): SelectionSuggestion[] => {
  return APPLICATION_ASSET_SELECTION_PRESETS[assetType].slice(0, 2).map(preset => ({
    id: preset.id,
    label: preset.label,
    instruction: preset.instruction,
  }));
};

export const useSelectionSuggestions = ({
  assetType,
  assetId,
  selectedText,
  documentBody,
  role,
  company,
  jobDescription,
  contactName,
  enabled = true,
}: UseSelectionSuggestionsInput): UseSelectionSuggestionsResult => {
  const trimmedSelection = selectedText.trim();
  const meetsMinLength = trimmedSelection.length >= APPLICATION_ASSET_MIN_SELECTION_CHARS;
  const cacheKey = useMemo(() => buildCacheKey(assetId, trimmedSelection), [assetId, trimmedSelection]);

  const [suggestions, setSuggestions] = useState<SelectionSuggestion[]>([]);
  const [status, setStatus] = useState<SelectionSuggestionsStatus>("idle");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !meetsMinLength) {
      setSuggestions([]);
      setStatus("idle");
      return;
    }

    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setStatus("success");
      return;
    }

    const requestId = ++requestIdRef.current;
    setSuggestions([]);
    setStatus("loading");

    const load = async () => {
      try {
        const result = await fetchSelectionSuggestions({
          type: assetType,
          selectedText: trimmedSelection,
          documentBody,
          role,
          company,
          jobDescription,
          contactName,
          assetId,
        });
        if (requestId !== requestIdRef.current) return;

        const data = result.data?.slice(0, 2) ?? [];
        if (data.length >= 2) {
          suggestionCache.set(cacheKey, data);
          setSuggestions(data);
          setStatus("success");
          return;
        }
        throw new Error("Insufficient suggestions returned");
      } catch {
        if (requestId !== requestIdRef.current) return;
        const fallback = toFallbackSuggestions(assetType);
        setSuggestions(fallback);
        setStatus("fallback");
      }
    };

    void load();
  }, [assetType, assetId, cacheKey, company, contactName, documentBody, enabled, jobDescription, meetsMinLength, role, trimmedSelection]);

  return { suggestions, status };
};
