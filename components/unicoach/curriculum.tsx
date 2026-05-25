export type ContentTab = "overview" | "resources";

export type OverviewSection = { title: string; body: string };

export type ResourceItem = {
  title: string;
  body?: string;
  hasVideo?: boolean;
  videoUrl?: string;
};

export type UnicoachCurriculumStage = {
  id: string;
  title: string;
  subtitle: string;
  callMilestone: 1 | 2 | 3 | null;
  isCallStage: boolean;
  overview: OverviewSection[];
  tasks: string[];
  resources: ResourceItem[];
  nextActionLabel: string;
};

export const videoUrlToEmbedSrc = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/youtube\.com\/embed\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.hostname.replace(/^www\./i, "").toLowerCase() === "youtube.com") return u.toString();
    } catch {
      return null;
    }
  }
  const m = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return null;
};

export const UNICOACH_STAGES: UnicoachCurriculumStage[] = [
  {
    id: "call-1-prep",
    title: "Stage 1 - Call 1 Prep",
    subtitle: "Niche fixing, base resume, and LinkedIn optimization before Call 1.",
    callMilestone: 1,
    isCallStage: true,
    overview: [
      {
        title: "Niche and market fit",
        body: "Define your niche clearly and validate it against market demand. Map who you serve, what problems you solve, and how hiring managers in that space describe success. Use the worksheet to pressure-test assumptions before you invest time in assets.",
      },
      {
        title: "Base resume",
        body: "Build a strong base resume focused on outcomes, not duties. Lead with impact bullets, quantify results where you can, and align language with roles you want. Expect several iterations; the goal is a document you can tailor quickly per application.",
      },
      {
        title: "LinkedIn before Call 1",
        body: "Optimize your LinkedIn headline and About section so they match your niche story. Recruiters skim both in seconds—make the first lines specific and credible. Add proof (projects, metrics, links) where it strengthens your positioning.",
      },
    ],
    tasks: ["Complete niche fixing worksheet", "Upload base resume draft", "Update LinkedIn headline and about section"],
    resources: [
      {
        title: "Niche Worksheet",
        body: "Walk through prompts to lock your niche statement and supporting evidence.",
      },
      {
        title: "Base Resume Guide",
        body: "Structure, bullet formulas, and examples for outcome-led resumes.",
      },
      {
        title: "LinkedIn Optimization Checklist",
        body: "Headline, About, featured links, and activity habits before your first call.",
      },
    ],
    nextActionLabel: "Book Call 1",
  },
  {
    id: "post-call-1",
    title: "Stage 2 - Post Call 1 Tasks",
    subtitle: "Execute post-call actions and complete portfolio tasks.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "Resume revisions",
        body: "Revise your resume based on coach feedback from Call 1. Capture every change request in a single doc so you can batch edits. Prioritize clarity and proof over length—most strong resumes stay tight once feedback is applied.",
      },
      {
        title: "LinkedIn follow-through",
        body: "Complete all LinkedIn tasks from Call 1 before you request Call 2. Treat LinkedIn as a living asset: update once, then reinforce with posts or comments that match your niche story.",
      },
      {
        title: "Portfolio tasks",
        body: "Your portfolio is built offline by the coach; complete assigned portfolio tasks on your side so assets stay aligned with what you pitch in applications. If something is unclear, note blockers in coach chat early.",
      },
    ],
    tasks: ["Revise resume", "Complete LinkedIn tasks", "Complete assigned portfolio tasks"],
    resources: [
      {
        title: "Resume Revision Checklist",
        body: "Section-by-section pass after coach comments.",
      },
      {
        title: "LinkedIn Task Board",
        body: "Track each LinkedIn deliverable and mark done when live on your profile.",
      },
      {
        title: "Portfolio Completion Notes",
        body: "What to verify before you sign off on portfolio-related tasks.",
      },
    ],
    nextActionLabel: "Unlock Call 2",
  },
  {
    id: "call-2",
    title: "Stage 3 - Call 2",
    subtitle: "Do one quality application together with your coach.",
    callMilestone: 2,
    isCallStage: true,
    overview: [
      {
        title: "One live application with your coach",
        body: "Use your polished assets to execute one high-quality application with your coach on the call. The goal is not speed—it is calibration. You should leave knowing what “good” looks like for your niche so you can repeat it without guesswork.",
      },
      {
        title: "Quality bar and repeatable framework",
        body: "Understand quality application standards: role fit, proof, specificity in answers, and follow-up. Capture the checklist your coach uses so your next solo applications inherit the same bar.",
      },
    ],
    tasks: [
      "Shortlist one target role and company",
      "Submit job description before call",
      "Attend Call 2 and complete one quality application",
    ],
    resources: [
      {
        title: "Quality Application Framework",
        body: "Criteria for role research, tailoring, and submission quality.",
      },
      {
        title: "Application Quality Checklist",
        body: "A printable pass before you hit submit on any application.",
      },
    ],
    nextActionLabel: "Join Call 2",
  },
  {
    id: "post-call-2",
    title: "Stage 4 - Post Call 2 Tasks",
    subtitle: "Start consistent execution and complete personal branding video.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "Independent execution",
        body: "Apply the same quality framework independently across multiple roles. Track where you cut corners—that is usually where response rate drops. Consistency beats bursts of activity.",
      },
      {
        title: "Personal branding video",
        body: "Watch the personal branding pre-recorded video and execute the action points. Treat it as implementation homework: pause, take notes, and schedule concrete posts or profile updates on your calendar.",
      },
    ],
    tasks: ["Complete 5 quality applications", "Watch personal branding video", "Post one personal branding update"],
    resources: [
      {
        title: "Personal Branding Video",
        body: "Pre-recorded walkthrough plus prompts to adapt to your niche.",
        hasVideo: true,
      },
      {
        title: "Weekly Application Planner",
        body: "Capacity, targets, and review rhythm for steady outbound.",
      },
      {
        title: "Networking Starter Template",
        body: "Short outreach angles that do not read like mass mail.",
      },
    ],
    nextActionLabel: "Prepare for Call 3",
  },
  {
    id: "call-3",
    title: "Stage 5 - Call 3",
    subtitle: "Interview preparation and personal branding refinement.",
    callMilestone: 3,
    isCallStage: true,
    overview: [
      {
        title: "Interview strategy",
        body: "Prepare for interviews with role-specific strategy: company context, likely questions, and stories that map to their language. Bring real JDs and interview loops you expect so feedback stays concrete.",
      },
      {
        title: "Personal branding refinement",
        body: "Refine personal branding with direct feedback from your coach—messaging, proof points, and how you show up in writing versus live conversation. Align public narrative with what you say in interviews.",
      },
    ],
    tasks: ["Submit interview target companies", "Complete interview prep worksheet", "Attend Call 3"],
    resources: [
      {
        title: "Interview Preparation Framework",
        body: "Structure for company research, story banks, and follow-up.",
      },
      {
        title: "Behavioral Question Bank",
        body: "Prompts mapped to STAR-style evidence from your experience.",
      },
      {
        title: "Personal Branding Review Sheet",
        body: "A coach-led rubric for headlines, About, and activity signals.",
      },
    ],
    nextActionLabel: "Join Call 3",
  },
  {
    id: "complete",
    title: "Stage 6 - Program Complete",
    subtitle: "Continue the system and sustain momentum.",
    callMilestone: null,
    isCallStage: false,
    overview: [
      {
        title: "What you have unlocked",
        body: "You have completed all three calls and mandatory stage tasks. The system you built—assets, outreach, interview prep—is yours to reuse. The remaining work is rhythm, not reinvention.",
      },
      {
        title: "Sustaining momentum",
        body: "Continue applying the same system with consistency: weekly targets, honest quality checks, and coach updates when you stall. Small steady improvements compound faster than occasional sprints.",
      },
    ],
    tasks: ["Follow weekly execution system", "Share progress update with your coach"],
    resources: [
      {
        title: "Weekly Execution System",
        body: "Cadence template for applications, networking, and follow-ups.",
      },
      {
        title: "Interview Confidence Toolkit",
        body: "Warm-up drills and last-mile checks before high-stakes rounds.",
      },
    ],
    nextActionLabel: "Continue System",
  },
];
