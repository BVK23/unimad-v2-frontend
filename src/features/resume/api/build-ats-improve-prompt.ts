import type { UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import type { AtsScoreViewModel, AtsSectionAnalysisRow, AtsSectionUiStatus } from "./ats-types";
import { buildResumeImproveAgentMessage, buildResumeImproveDisplayMessage } from "./resume-improve-prompts";

export type AtsImprovePromptInput = {
  section: UnibotResumeSection;
  sectionLabel: string;
  hasContent: boolean;
  atsVm: Pick<AtsScoreViewModel, "score" | "generalScore" | "jdMatchScore" | "scoringMode">;
  sectionRow: Pick<AtsSectionAnalysisRow, "fullFeedback" | "scoreLabel" | "status">;
  sectionImprovements: string[];
};

const statusLabel = (status: AtsSectionUiStatus): string => {
  if (status === "good") return "strong";
  if (status === "critical") return "needs improvement";
  return "needs attention";
};

const formatOverallBlock = (atsVm: AtsImprovePromptInput["atsVm"]): string => {
  const lines = [`Overall ATS: ${atsVm.score}/100`];
  if (atsVm.scoringMode === "jd_blended" && atsVm.generalScore != null && atsVm.jdMatchScore != null) {
    lines.push(`Resume quality: ${atsVm.generalScore}/100 · Job match: ${atsVm.jdMatchScore}/100`);
  }
  return lines.join("\n");
};

export const buildAtsImproveDisplayMessage = (sectionLabel: string): string => `ATS fix: Improve ${sectionLabel}`;

export const buildAtsImproveAgentMessage = (input: AtsImprovePromptInput): string => {
  const base = buildResumeImproveAgentMessage({
    section: input.section,
    hasContent: input.hasContent,
  });

  const improvementBlock =
    input.sectionImprovements.length > 0 ? input.sectionImprovements.map(item => `- ${item}`).join("\n") : "- None listed for this section";

  const scorePart = input.sectionRow.scoreLabel ? ` — score ${input.sectionRow.scoreLabel}` : "";

  const isProjects = input.section === "projects";
  const jdOverlay =
    input.atsVm.scoringMode === "jd_blended"
      ? `
JD match mode: stay inside the ${input.sectionLabel} section. Prioritise exact keywords and tool names from the section-specific improvements above. Weave missing keywords into this section where true — do not invent other sections (especially Projects) just to park keywords.`
      : "";

  const projectsRule = isProjects
    ? `
Project dates are optional — do not ask the user for start/end dates unless they already exist on the entry. Use get_projects / update_project for title, description, and url only.`
    : "";

  const summaryRule =
    input.section === "summary"
      ? `
Summary only: edit the professional summary paragraph. Do not change header contact fields (email, phone, LinkedIn, GitHub).`
      : "";

  return `${base}

You are improving the ${input.sectionLabel} section based on an ATS score report.

${formatOverallBlock(input.atsVm)}
Section: ${input.sectionLabel}${scorePart} — status ${statusLabel(input.sectionRow.status)}

Detailed ATS analysis for this section:
${input.sectionRow.fullFeedback}

Section-specific improvements:
${improvementBlock}

Use resume tools to read current content and apply targeted edits. Do not rewrite unrelated sections.
Preserve existing role titles, metrics, and specific tool or technology names unless the ATS analysis explicitly asks to change them.${jdOverlay}${projectsRule}${summaryRule}

Follow-up turns: if the user declines optional additions, says no further changes, or is done with this section, acknowledge briefly in one sentence and stop — do not re-ask the same question or treat their reply as out of scope.`;
};

export const buildAtsImproveTopicTitle = (sectionLabel: string): string => `ATS fix · ${sectionLabel}`;

/** Main chat session label for Fix with Unibot (parent of ATS fix sub-threads). */
export const buildAtsFixMainSessionTitle = (resumeLabel: string): string => {
  const label = resumeLabel.trim() || "Resume";
  return `ATS fix · ${label}`;
};

/** Display bubble for ATS batch (short user-visible copy). */
export const buildAtsImproveUserDisplay = (input: AtsImprovePromptInput): string => buildAtsImproveDisplayMessage(input.sectionLabel);

/** Fallback display when reusing resume improve helpers directly. */
export const buildAtsImproveDisplayFromResume = (section: UnibotResumeSection, hasContent: boolean): string =>
  buildResumeImproveDisplayMessage({ section, hasContent });
