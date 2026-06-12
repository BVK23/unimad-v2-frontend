import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Crosshair, Minus, Megaphone, MousePointerClick, Scissors, Heart, UserCheck, Sparkles } from "lucide-react";

export const APPLICATION_ASSET_MIN_SELECTION_CHARS = 10;

const DOCUMENT_LABELS: Record<ApplicationAssetApiType, string> = {
  coverletter: "cover letter",
  coldemail: "cold email",
  referral: "referral message",
};

export type ApplicationAssetSelectionPreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
  /** Full-document improve from Prepare → Studio (entire asset, not a selection). */
  fullDocumentInstruction?: string;
};

const coverLetterPresets: ApplicationAssetSelectionPreset[] = [
  {
    id: "quantify-impact",
    label: "Quantify impact",
    icon: BarChart3,
    instruction:
      "Rewrite ONLY this section of my cover letter to include specific metrics, numbers, or measurable outcomes that demonstrate impact. Keep the rest of the letter unchanged.",
    fullDocumentInstruction:
      "Rewrite the entire cover letter to include specific metrics, numbers, or measurable outcomes that demonstrate impact.",
  },
  {
    id: "align-to-role",
    label: "Align to role",
    icon: Crosshair,
    instruction:
      "Rewrite ONLY this section to better connect with the company's mission or specific requirements from the job description. Keep the rest of the letter unchanged.",
    fullDocumentInstruction:
      "Rewrite the entire cover letter to better connect with the company's mission and specific requirements from the job description.",
  },
  {
    id: "tighten",
    label: "Tighten",
    icon: Minus,
    instruction:
      "Make ONLY this section more concise. Target 10-15 word sentences, cut filler words, keep the core point. Do not change the rest of the letter.",
    fullDocumentInstruction:
      "Make the entire cover letter more concise. Target 10-15 word sentences, cut filler words, and keep the core points.",
  },
];

const coldEmailPresets: ApplicationAssetSelectionPreset[] = [
  {
    id: "punchier-hook",
    label: "Punchier hook",
    icon: Megaphone,
    instruction:
      "Rewrite ONLY this section to be more attention-grabbing for a cold outreach to a recruiter. Make it direct and curiosity-inducing. Keep the rest of the email unchanged.",
    fullDocumentInstruction:
      "Rewrite the entire cold email to be more attention-grabbing for a recruiter. Make it direct and curiosity-inducing.",
  },
  {
    id: "stronger-cta",
    label: "Stronger CTA",
    icon: MousePointerClick,
    instruction:
      "Rewrite ONLY this section with a clearer, more compelling call-to-action. Make it frictionless for them to respond. Keep the rest of the email unchanged.",
    fullDocumentInstruction:
      "Rewrite the entire cold email with a clearer, more compelling call-to-action. Make it frictionless for them to respond.",
  },
  {
    id: "cut-essentials",
    label: "Cut to essentials",
    icon: Scissors,
    instruction:
      "This cold email must stay under 100 words total. Cut every unnecessary word from ONLY this section while keeping the core message. Do not change the rest.",
    fullDocumentInstruction: "This cold email must stay under 100 words total. Cut every unnecessary word while keeping the core message.",
  },
];

const referralPresets: ApplicationAssetSelectionPreset[] = [
  {
    id: "soften-ask",
    label: "Soften the ask",
    icon: Heart,
    instruction:
      "Rewrite ONLY this section to feel less like a direct request and more like seeking advice or guidance. Keep it warm. Do not change the rest of the message.",
  },
  {
    id: "highlight-fit",
    label: "Highlight my fit",
    icon: UserCheck,
    instruction:
      "Rewrite ONLY this section to more specifically connect my skills and experience to the role, making it easier for my connection to advocate for me. Keep the rest unchanged.",
  },
  {
    id: "warmer-tone",
    label: "Warmer tone",
    icon: Sparkles,
    instruction:
      "Make ONLY this section more personal and warm, like I'm writing to someone I genuinely value. Do not change the rest of the message.",
  },
];

export const APPLICATION_ASSET_SELECTION_PRESETS: Record<ApplicationAssetApiType, ApplicationAssetSelectionPreset[]> = {
  coverletter: coverLetterPresets,
  coldemail: coldEmailPresets,
  referral: referralPresets,
};

export const buildSelectionRefineUserMessage = (assetType: ApplicationAssetApiType, selectedText: string, instruction: string): string => {
  const docLabel = DOCUMENT_LABELS[assetType];
  const quoted = selectedText.trim().replace(/"/g, "'");
  return [
    `I want to refine a specific part of my ${docLabel}.`,
    "",
    "Here is the section I selected:",
    `> "${quoted}"`,
    "",
    instruction.trim(),
    "",
    "IMPORTANT: Output the complete revised document with ONLY the quoted section changed. Keep everything else exactly as is.",
  ].join("\n");
};

export const buildFreeformSelectionUserMessage = (
  assetType: ApplicationAssetApiType,
  selectedText: string,
  userInstruction: string
): string => {
  const docLabel = DOCUMENT_LABELS[assetType];
  const quoted = selectedText.trim().replace(/"/g, "'");
  const instruction = userInstruction.trim();
  return [
    `I want to refine a specific part of my ${docLabel}.`,
    "",
    "Here is the section I selected:",
    `> "${quoted}"`,
    "",
    instruction,
    "",
    "IMPORTANT: Output the complete revised document with ONLY the quoted section changed. Keep everything else exactly as is.",
  ].join("\n");
};

export const assetTypeDisplayLabel = (assetType: ApplicationAssetApiType): string => {
  switch (assetType) {
    case "coverletter":
      return "cover letter";
    case "coldemail":
      return "cold email";
    case "referral":
      return "referral request";
    default:
      return "document";
  }
};

export const buildFullDocumentRefineUserMessage = (assetType: ApplicationAssetApiType, instruction: string): string => {
  const docLabel = DOCUMENT_LABELS[assetType];
  return [
    `Please improve my entire ${docLabel}.`,
    "",
    instruction.trim(),
    "",
    "IMPORTANT: Output the complete revised document. Keep the same structure unless the instruction says otherwise.",
  ].join("\n");
};

export const buildFullDocumentFreeformUserMessage = (assetType: ApplicationAssetApiType, userInstruction: string): string => {
  const docLabel = DOCUMENT_LABELS[assetType];
  const instruction = userInstruction.trim();
  return [
    `Please improve my entire ${docLabel}.`,
    "",
    instruction,
    "",
    "IMPORTANT: Output the complete revised document. Keep the same structure unless my instruction says otherwise.",
  ].join("\n");
};
