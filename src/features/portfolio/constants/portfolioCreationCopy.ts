export type PortfolioCreationVariant = "fetch" | "ai_initial" | "blank" | "ai_clone";

export type PortfolioCreationCopy = {
  primary: string;
  escalation7s: string | null;
  escalation15s: string | null;
  rotateSteps: boolean;
};

export const PORTFOLIO_CREATION_STEPS = [
  "Reading your profile…",
  "Writing your summary…",
  "Highlighting your strengths…",
  "Adding experience and projects…",
  "Shaping your story…",
  "Laying out your portfolio…",
] as const;

export const PORTFOLIO_CREATION_COPY: Record<PortfolioCreationVariant, PortfolioCreationCopy> = {
  fetch: {
    primary: "Loading your portfolio…",
    escalation7s: null,
    escalation15s: null,
    rotateSteps: false,
  },
  ai_initial: {
    primary: "Building your portfolio from your profile…",
    escalation7s: "Still working—this can take a minute.",
    escalation15s: "Taking longer than usual. You can keep this tab open.",
    rotateSteps: true,
  },
  blank: {
    primary: "Setting up your canvas…",
    escalation7s: "Almost ready.",
    escalation15s: "Taking longer than usual.",
    rotateSteps: false,
  },
  ai_clone: {
    primary: "Creating your new portfolio…",
    escalation7s: "Still working—this can take a minute.",
    escalation15s: "Taking longer than usual. You can keep this tab open.",
    rotateSteps: true,
  },
};

export const PORTFOLIO_STEP_ROTATION_MS = 9000;

export const PORTFOLIO_ESCALATION_7S = 7;
export const PORTFOLIO_ESCALATION_15S = 15;
