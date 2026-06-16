import type { ResumeTemplateId } from "@/types";

/**
 * Region → template recommendation (v1 parity + IN/GB → basic for international students).
 * Classic is retained for existing resumes but hidden from the picker for beta.
 */
export function recommendTemplate(countryCode: string | null | undefined): ResumeTemplateId {
  if (!countryCode) return "basic";

  const code = countryCode.toUpperCase().trim();
  const countryToTemplate: Record<string, ResumeTemplateId> = {
    US: "us",
    CA: "canada",
    AU: "aus",
    IE: "ireland",
    IN: "basic",
    GB: "basic",
  };

  return countryToTemplate[code] ?? "basic";
}
