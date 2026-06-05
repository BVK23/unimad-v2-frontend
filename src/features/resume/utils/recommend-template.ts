import type { ResumeTemplateId } from "@/types";

/**
 * Region → template recommendation (v1 parity + IN/GB → classic for international students).
 */
export function recommendTemplate(countryCode: string | null | undefined): ResumeTemplateId {
  if (!countryCode) return "classic";

  const code = countryCode.toUpperCase().trim();
  const countryToTemplate: Record<string, ResumeTemplateId> = {
    US: "us",
    CA: "canada",
    AU: "aus",
    IE: "ireland",
    IN: "classic",
    GB: "classic",
  };

  return countryToTemplate[code] ?? "classic";
}
