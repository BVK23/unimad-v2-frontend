"use client";

import { useEffect, useState } from "react";
import { fetchCountryCode } from "@/features/resume/utils/geolocation-service";
import { recommendTemplate } from "@/features/resume/utils/recommend-template";
import type { ResumeTemplateId } from "@/types";

export function useGeolocationTemplate() {
  const [recommendedTemplate, setRecommendedTemplate] = useState<ResumeTemplateId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const countryCode = await fetchCountryCode();
        if (!cancelled) {
          setRecommendedTemplate(recommendTemplate(countryCode));
        }
      } catch {
        if (!cancelled) setRecommendedTemplate("classic");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { recommendedTemplate, isLoading };
}
