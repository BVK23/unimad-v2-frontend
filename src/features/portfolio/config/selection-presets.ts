import type { LucideIcon } from "lucide-react";
import { Minus, Sparkles, Target, Wand2 } from "lucide-react";

export const PORTFOLIO_MIN_SELECTION_CHARS = 10;

export type PortfolioSelectionPreset = {
  id: string;
  label: string;
  icon: LucideIcon;
  instruction: string;
};

export const PORTFOLIO_SELECTION_PRESETS: PortfolioSelectionPreset[] = [
  {
    id: "punchier",
    label: "Make punchier",
    icon: Sparkles,
    instruction:
      "Rewrite ONLY the selected portfolio text to be more vivid and engaging. Keep the same meaning and tone family. Do not change other blocks.",
  },
  {
    id: "tighten",
    label: "Tighten",
    icon: Minus,
    instruction:
      "Make ONLY the selected portfolio text more concise. Cut filler words while preserving the core message. Do not change other blocks.",
  },
  {
    id: "align-story",
    label: "Sharpen story",
    icon: Target,
    instruction:
      "Rewrite ONLY the selected portfolio text so it better supports the user's professional story and value proposition. Do not change other blocks.",
  },
  {
    id: "improve",
    label: "Improve with Unibot",
    icon: Wand2,
    instruction: "Improve ONLY the selected portfolio text for clarity, impact, and professionalism. Do not change other blocks.",
  },
];

export const buildPortfolioSelectionRefineMessage = (selectedText: string, instruction: string) =>
  `Please update my portfolio draft.\n\nSelected text:\n"""${selectedText.trim()}"""\n\nInstruction: ${instruction}`;
