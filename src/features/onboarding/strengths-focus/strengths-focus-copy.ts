import type { StrengthsFocusTrigger } from "./useStrengthsFocusStore";

export function strengthsFocusIntroMessage(trigger: StrengthsFocusTrigger, firstName?: string | null): string {
  const hey = firstName?.trim() ? `Hey ${firstName.trim()}` : "Hey";

  switch (trigger) {
    case "linkedin":
      return `${hey} — quick step before we personalise your LinkedIn improvements. Pick what comes naturally to you below — this shapes your voice in posts, comments, and profile copy. You can also chat if you want different options.`;
    case "resume":
      return `${hey} — before we tailor your resume improvements, tell us what comes naturally to you. This helps Unibot match your voice.`;
    case "application_asset":
      return `${hey} — to personalise your cover letters and application drafts, pick a few strengths that fit you.`;
    case "content_gen":
      return `${hey} — to match your voice in posts and content, tell us what comes naturally to you.`;
    case "dev":
      return `${hey} — preview mode. Pick strengths so Unibot can personalise LinkedIn, applications, and content for you.`;
    default:
      return `${hey} — we need a few more details to personalise your Unimad experience. Pick what comes naturally to you below. You can also chat if you want different options.`;
  }
}
