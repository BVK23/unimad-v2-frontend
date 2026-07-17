/** Form defaults shown when a Studio VPD template is selected for preview. */
export type VpdTemplateFormDefaults = {
  role: string;
  company: string;
  jobDescription: string;
};

const GENERAL_PITCH_JD =
  "We're hiring a Marketing Manager to own brand visibility and engagement. You'll design campaigns, partner with product and growth, and ship creative work that drives measurable acquisition and retention.";

const UMA_JD =
  "UMA is hiring a Sales Engineer / Web3 Developer Relations partner to translate protocol value for builders and partners. You'll run technical discovery, support partnership conversations, and help grow developer adoption across the UMA ecosystem.";

const DIGITAL_WORLD_JD =
  "Digital World is hiring a Junior Cloud Engineer to help build secure, automated cloud infrastructure. You'll work with Kubernetes, cloud platforms (AWS/Azure), CI/CD, and partner ecosystems to support digital transformation initiatives.";

/** Known Studio V2 template ids → role / company / JD for the left-hand generator form. */
export const VPD_TEMPLATE_FORM_DEFAULTS: Record<string, VpdTemplateFormDefaults> = {
  "vpd-template-1": {
    role: "Marketing Manager",
    company: "Acme Corp",
    jobDescription: GENERAL_PITCH_JD,
  },
  "vpd-template-3": {
    role: "Web3 Dev",
    company: "UMA",
    jobDescription: UMA_JD,
  },
  "vpd-template-5": {
    role: "Cloud Engineer",
    company: "Digital World",
    jobDescription: DIGITAL_WORLD_JD,
  },
};

export const getVpdTemplateFormDefaults = (templateId: string | null | undefined): VpdTemplateFormDefaults | null => {
  if (!templateId?.trim()) return null;
  return VPD_TEMPLATE_FORM_DEFAULTS[templateId.trim()] ?? null;
};
