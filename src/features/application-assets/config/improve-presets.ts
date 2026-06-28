import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { SelectionSuggestion } from "@/features/application-assets/types";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Crosshair, Heart, Megaphone, MousePointerClick, Sparkles, UserCheck } from "lucide-react";

export type FullDocumentImprovePreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
};

const ICON_BY_ID: Record<string, LucideIcon> = {
  "stronger-opening": Sparkles,
  "quantify-impact": BarChart3,
  "punchier-hook": Megaphone,
  "stronger-cta": MousePointerClick,
  "soften-ask": Heart,
  "highlight-fit": UserCheck,
  "align-to-role": Crosshair,
  "tighten-language": Sparkles,
};

/** Fallback when document-improve-suggestions API is unavailable. */
export const APPLICATION_ASSET_FULL_DOCUMENT_IMPROVE_FALLBACK: Record<ApplicationAssetApiType, FullDocumentImprovePreset[]> = {
  coverletter: [
    {
      id: "stronger-opening",
      label: "Stronger opening",
      icon: Sparkles,
      instruction:
        "Rewrite the opening paragraph to be more compelling and role-specific. Avoid generic lines like \"couldn't resist applying\" or overly casual hooks. Lead with a sharp, credible reason you're a strong fit.",
    },
    {
      id: "quantify-impact",
      label: "Quantify impact",
      icon: BarChart3,
      instruction:
        "Rewrite the entire cover letter to include specific metrics, numbers, or measurable outcomes that demonstrate impact. Keep the same structure unless a section needs to change to fit the numbers.",
    },
    {
      id: "align-to-role",
      label: "Align to role",
      icon: Crosshair,
      instruction:
        "Rewrite the entire cover letter so every paragraph ties your experience directly to the job description and company. Remove generic filler.",
    },
    {
      id: "tighten-language",
      label: "Tighten language",
      icon: Sparkles,
      instruction:
        "Rewrite the entire cover letter to be more concise and punchy. Cut redundancy and weak phrases while preserving all key achievements.",
    },
  ],
  coldemail: [
    {
      id: "punchier-hook",
      label: "Punchier hook",
      icon: Megaphone,
      instruction:
        "Rewrite the entire cold email to be more attention-grabbing for a recruiter. Make the opening direct and curiosity-inducing without sounding salesy.",
    },
    {
      id: "stronger-cta",
      label: "Stronger CTA",
      icon: MousePointerClick,
      instruction:
        "Rewrite the entire cold email with a clearer, more compelling call-to-action. Make it frictionless for them to respond.",
    },
    {
      id: "cut-to-essentials",
      label: "Cut to essentials",
      icon: Sparkles,
      instruction: "Rewrite the entire cold email to be shorter and scannable while keeping the strongest proof point and CTA.",
    },
    {
      id: "add-proof-point",
      label: "Add proof point",
      icon: BarChart3,
      instruction: "Rewrite the entire cold email to include one concrete, quantified proof point that shows you can deliver in this role.",
    },
  ],
  referral: [
    {
      id: "soften-ask",
      label: "Soften the ask",
      icon: Heart,
      instruction:
        "Rewrite the entire referral message to feel less like a direct request and more like seeking advice or guidance. Keep it warm and personal.",
    },
    {
      id: "highlight-fit",
      label: "Highlight my fit",
      icon: UserCheck,
      instruction:
        "Rewrite the entire referral message to more specifically connect my skills and experience to the role, making it easier for my connection to advocate for me.",
    },
    {
      id: "warmer-tone",
      label: "Warmer tone",
      icon: Sparkles,
      instruction: "Rewrite the entire referral message with a warmer, more personal tone while keeping the ask clear.",
    },
    {
      id: "clearer-context",
      label: "Clearer context",
      icon: Crosshair,
      instruction:
        "Rewrite the entire referral message so the role, company, and why you're reaching out are crystal clear for your connection.",
    },
  ],
};

export const suggestionToFullDocumentPreset = (suggestion: SelectionSuggestion): FullDocumentImprovePreset => ({
  id: suggestion.id,
  label: suggestion.label,
  instruction: suggestion.instruction,
  icon: ICON_BY_ID[suggestion.id] ?? Sparkles,
});

export const buildFullDocumentImproveMessage = (assetType: ApplicationAssetApiType, instruction: string): string => {
  const docLabel = assetType === "coverletter" ? "cover letter" : assetType === "coldemail" ? "cold email" : "referral message";
  return [
    `Please improve my entire ${docLabel}.`,
    "",
    instruction.trim(),
    "",
    "IMPORTANT: Output the complete revised document. Keep the same structure unless the instruction says otherwise.",
  ].join("\n");
};
