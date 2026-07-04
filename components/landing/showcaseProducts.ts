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

/** A single screenshot for the fixed center screen.
 *  - `cover` (default): fills the frame, cropping overflow (best for landscape shots).
 *  - `contain`: scales the whole shot to fit inside the frame on a soft backdrop
 *    (best for tall/portrait shots like modals, so nothing is cropped or upscaled). */
export type ShowcaseShot = {
  src: string;
  fit?: "cover" | "contain";
  /** Extra scale applied inside the fixed frame (e.g. 1.4 zooms a small/narrow
   *  shot in; the frame clips any overflow). Defaults to 1. */
  zoom?: number;
  /** Removes the inner padding on a `contain` shot so it spans the frame
   *  edge-to-edge (use for wide, short strips that should fill the full width). */
  bleed?: boolean;
  /** Background colour for the frame behind this shot. Set it to the
   *  screenshot's own background so the `contain` gutters blend seamlessly
   *  (defaults to white). */
  bg?: string;
};

export type ShowcaseProduct = {
  id: string;
  title: string;
  label: string;
  lines: [string, string];
  highlightWord?: string;
  bullets: string[];
  /** One screenshot per bullet (index-aligned). Shown in the fixed center
   *  screen as each point becomes active. Falls back to the UI mock if absent. */
  screenshots?: ShowcaseShot[];
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
    bullets: ["Tailor your résumé to any job in one click", "Live ATS score out of 100", "AI rewrites, then export to PDF or a share link"],
    screenshots: [
      { src: "/images/landing/showcase/resume/point-1.png", fit: "contain" },
      { src: "/images/landing/showcase/resume/point-2.png", fit: "contain", bg: "#FFFFFF" },
      { src: "/images/landing/showcase/resume/point-3.png", fit: "contain", bg: "#F1F5F9" },
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
    screenshots: [
      { src: "/images/landing/showcase/portfolio/point-1.png", fit: "contain", bg: "#F9FAFC" },
      { src: "/images/landing/showcase/portfolio/point-2.png", fit: "contain", bg: "#F8FAFC" },
      { src: "/images/landing/showcase/portfolio/point-3.png", fit: "contain", bg: "#F8FAFC" },
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
      "Recommended jobs that matches your profile",
      "Keep track of all your applications",
      "Tailored résumé, cover letter and email per role",
    ],
    screenshots: [
      { src: "/images/landing/showcase/jobs/point-1.png", fit: "contain", bleed: true, bg: "#F9FAFC" },
      { src: "/images/landing/showcase/jobs/point-2.png", fit: "contain", bg: "#F8FAFC" },
      { src: "/images/landing/showcase/jobs/point-3.png", fit: "contain", bg: "#F8FAFC" },
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
      "AI rewrites your Headline, About and Skills",
      "Personalised connection requests and scheduled posts",
    ],
    screenshots: [
      { src: "/images/landing/showcase/linkedin/point-1.png", fit: "contain", bg: "#F7F9FB" },
      { src: "/images/landing/showcase/linkedin/point-2.png", fit: "contain" },
      { src: "/images/landing/showcase/linkedin/point-3.png", fit: "contain", bg: "#F8FAFC" },
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
    screenshots: [
      { src: "/images/landing/showcase/content-lab/point-1.png", fit: "contain", bg: "#F1F5F9" },
      { src: "/images/landing/showcase/content-lab/point-2.png", fit: "contain" },
      { src: "/images/landing/showcase/content-lab/point-3.png" },
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
    screenshots: [
      { src: "/images/landing/showcase/interviews/point-1.png", fit: "contain", bg: "#060a14" },
      { src: "/images/landing/showcase/interviews/point-2.png", fit: "contain" },
      { src: "/images/landing/showcase/interviews/point-3.png", fit: "contain", bg: "#F8F9FB" },
    ],
    ctaLabel: "Start a mock interview",
    prompts: ["Start a mock interview", "Give me feedback on my answers", "Practice behavioural questions", "Simulate a technical round"],
  },
];

export function showcaseFeatureSide(index: number): "left" | "right" {
  return index % 2 === 0 ? "left" : "right";
}
