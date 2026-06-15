/** Machine-readable action label appended to refine prompts so history reload can restore RefineActionCard titles. */
const ACTION_LABEL_MARKER = /\n?\[UNIMAD_ACTION:([^\]]+)\]\s*$/;

export const IMPROVE_WITH_UNIBOT_ACTION_LABEL = "Improve with Unibot";

export function embedActionLabelInRefineMessage(message: string, actionLabel: string): string {
  const label = actionLabel.trim();
  if (!label) {
    return message.trim();
  }
  const withoutMarker = message.replace(ACTION_LABEL_MARKER, "").trimEnd();
  return `${withoutMarker}\n\n[UNIMAD_ACTION:${label}]`;
}

export function extractActionLabelFromRefineMessage(text: string): { label: string | null; textWithoutMarker: string } {
  const match = text.match(ACTION_LABEL_MARKER);
  if (!match?.[1]) {
    return { label: null, textWithoutMarker: text };
  }
  return {
    label: match[1].trim(),
    textWithoutMarker: text.replace(ACTION_LABEL_MARKER, "").trimEnd(),
  };
}

export function withPersistedActionLabel(text: string, actionLabel?: string | null): string {
  const label = actionLabel?.trim();
  if (!label) {
    return text.trim();
  }
  return embedActionLabelInRefineMessage(text, label);
}
