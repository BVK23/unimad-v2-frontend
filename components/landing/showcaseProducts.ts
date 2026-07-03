export const SHOWCASE_AUTOPLAY_MS = 5000;

export type ShowcaseCallout = {
  x: number;
  y: number;
  label: string;
};

export const SHOWCASE_DEFAULT_PROMPTS = [
  "Help me land my dream role",
  "Build my personal brand",
  "Tailor my résumé for a job",
  "Prep me for an interview",
];

export type ShowcaseProduct = {
  id: string;
  title: string;
  label: string;
  lines: [string, string];
  highlightWord?: string;
  bullets: string[];
  ctaLabel: string;
  prompts: string[];
};

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "resume",
    title: "Résumé builder",
    label: "Build ATS friendly résumés with AI",
    lines: ["Build ATS friendly Resumes", "with AI"],
    highlightWord: "Resumes",
    bullets: [
      "Live ATS score out of 100, fixed as you type",
      "Tailor your résumé to any job in one click",
      "AI rewrites, then export to PDF or a share link",
    ],
    ctaLabel: "Build my résumé",
    prompts: ["Improve the ATS score", "Rewrite my summary", "Tailor this résumé for a role", "Strengthen my bullet points"],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    label: "A portfolio website to mark your presence",
    lines: ["A portfolio website to", "mark your presence"],
    bullets: [
      "Build a portfolio site in minutes, no code",
      "Drag-and-drop blocks for projects, media and embeds",
      "Publish to your own link, always in sync",
    ],
    ctaLabel: "Create my portfolio",
    prompts: ["Improve my portfolio layout", "Write my bio section", "Add a project showcase", "Suggest a portfolio theme"],
  },
  {
    id: "jobs",
    title: "Job tracker",
    label: "Prepare, track, and apply to jobs",
    lines: ["Prepare, Track and", "Apply to jobs"],
    bullets: [
      "Match-scored roles from your résumé and portfolio",
      "Drag from draft to applied to offer in one board",
      "Tailored résumé, cover letter and email per role",
    ],
    ctaLabel: "Start tracking jobs",
    prompts: [
      "Find roles matching my profile",
      "Track my job applications",
      "Draft a cover letter for this role",
      "Prep me for this interview",
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn audit",
    label: "Turn your LinkedIn into a recruiter magnet",
    lines: ["Turn your LinkedIn into", "a recruiter magnet"],
    bullets: [
      "Profile Strength score across six sections",
      "AI rewrites for your headline, about and keywords",
      "Personalised connection requests and scheduled posts",
    ],
    ctaLabel: "Audit my LinkedIn",
    prompts: ["Rewrite my headline", "Optimize my about section", "Suggest skills to highlight", "Make my profile recruiter-ready"],
  },
  {
    id: "content-lab",
    title: "Content Lab",
    label: "Unimad Content Studio",
    lines: ["Unimad Content", "Studio"],
    bullets: [
      "Draft posts, cover letters and emails in your voice",
      "Live preview with AI edits you accept or undo",
      "Schedule posts and reuse your best content",
    ],
    ctaLabel: "Open Content Lab",
    prompts: ["Write a LinkedIn post", "Draft a cold outreach email", "Create a cover letter draft", "Schedule this week's content"],
  },
  {
    id: "interviews",
    title: "Interview prep",
    label: "Practice interviews with live feedback",
    lines: ["Practice interviews with", "live feedback"],
    bullets: [
      "Practice out loud with a voice interviewer",
      "Behavioural and role-specific rounds for any job",
      "A scored report with STAR-method feedback",
    ],
    ctaLabel: "Start a mock interview",
    prompts: ["Start a mock interview", "Give me feedback on my answers", "Practice behavioural questions", "Simulate a technical round"],
  },
];

export function showcaseFeatureSide(index: number): "left" | "right" {
  return index % 2 === 0 ? "left" : "right";
}
