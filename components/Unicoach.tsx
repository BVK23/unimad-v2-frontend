import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowDownUp,
  ArrowLeft,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Filter,
  Lock,
  Minimize2,
  PlayCircle,
  Search,
  Sparkles,
  Star,
  SendHorizontal,
  Users,
  X,
} from "lucide-react";

type ContentTab = "overview" | "resources";

type OverviewSection = { title: string; body: string };

type ResourceItem = {
  title: string;
  body?: string;
  /** Reserved 16:9 slot for a video (no URL yet). Ignored if `videoUrl` yields a valid embed. */
  hasVideo?: boolean;
  /** Optional embed URL (YouTube watch, youtu.be, or direct embed URL). */
  videoUrl?: string;
};

type Stage = {
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

/** Allow only YouTube watch, youtu.be, or embed URLs → embed src. */
function videoUrlToEmbedSrc(url: string): string | null {
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
}

const STAGES: Stage[] = [
  {
    id: "call-1-prep",
    title: "Stage 1 - Call 1 Prep",
    subtitle: "Niche fixing, base resume, and LinkedIn optimization before Call 1.",
    callMilestone: 1,
    isCallStage: true,
    overview: [
      {
        title: "Niche and market fit",
        body:
          "Define your niche clearly and validate it against market demand. Map who you serve, what problems you solve, and how hiring managers in that space describe success. Use the worksheet to pressure-test assumptions before you invest time in assets.",
      },
      {
        title: "Base resume",
        body:
          "Build a strong base resume focused on outcomes, not duties. Lead with impact bullets, quantify results where you can, and align language with roles you want. Expect several iterations; the goal is a document you can tailor quickly per application.",
      },
      {
        title: "LinkedIn before Call 1",
        body:
          "Optimize your LinkedIn headline and About section so they match your niche story. Recruiters skim both in seconds—make the first lines specific and credible. Add proof (projects, metrics, links) where it strengthens your positioning.",
      },
    ],
    tasks: [
      "Complete niche fixing worksheet",
      "Upload base resume draft",
      "Update LinkedIn headline and about section",
    ],
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
        body:
          "Revise your resume based on coach feedback from Call 1. Capture every change request in a single doc so you can batch edits. Prioritize clarity and proof over length—most strong resumes stay tight once feedback is applied.",
      },
      {
        title: "LinkedIn follow-through",
        body:
          "Complete all LinkedIn tasks from Call 1 before you request Call 2. Treat LinkedIn as a living asset: update once, then reinforce with posts or comments that match your niche story.",
      },
      {
        title: "Portfolio tasks",
        body:
          "Your portfolio is built offline by the coach; complete assigned portfolio tasks on your side so assets stay aligned with what you pitch in applications. If something is unclear, note blockers in coach chat early.",
      },
    ],
    tasks: [
      "Revise resume",
      "Complete LinkedIn tasks",
      "Complete assigned portfolio tasks",
    ],
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
        body:
          "Use your polished assets to execute one high-quality application with your coach on the call. The goal is not speed—it is calibration. You should leave knowing what “good” looks like for your niche so you can repeat it without guesswork.",
      },
      {
        title: "Quality bar and repeatable framework",
        body:
          "Understand quality application standards: role fit, proof, specificity in answers, and follow-up. Capture the checklist your coach uses so your next solo applications inherit the same bar.",
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
        body:
          "Apply the same quality framework independently across multiple roles. Track where you cut corners—that is usually where response rate drops. Consistency beats bursts of activity.",
      },
      {
        title: "Personal branding video",
        body:
          "Watch the personal branding pre-recorded video and execute the action points. Treat it as implementation homework: pause, take notes, and schedule concrete posts or profile updates on your calendar.",
      },
    ],
    tasks: [
      "Complete 5 quality applications",
      "Watch personal branding video",
      "Post one personal branding update",
    ],
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
        body:
          "Prepare for interviews with role-specific strategy: company context, likely questions, and stories that map to their language. Bring real JDs and interview loops you expect so feedback stays concrete.",
      },
      {
        title: "Personal branding refinement",
        body:
          "Refine personal branding with direct feedback from your coach—messaging, proof points, and how you show up in writing versus live conversation. Align public narrative with what you say in interviews.",
      },
    ],
    tasks: [
      "Submit interview target companies",
      "Complete interview prep worksheet",
      "Attend Call 3",
    ],
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
        body:
          "You have completed all three calls and mandatory stage tasks. The system you built—assets, outreach, interview prep—is yours to reuse. The remaining work is rhythm, not reinvention.",
      },
      {
        title: "Sustaining momentum",
        body:
          "Continue applying the same system with consistency: weekly targets, honest quality checks, and coach updates when you stall. Small steady improvements compound faster than occasional sprints.",
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

const TOTAL_UNICOACH_TASKS = STAGES.reduce((total, stage) => total + stage.tasks.length, 0);

const STAGE_CHAT_SEED: Record<string, { sender: "coach" | "student"; text: string }[]> = {
  "call-1-prep": [
    {
      sender: "coach",
      text: "Start with your niche worksheet first, then upload your resume draft.",
    },
  ],
  "post-call-1": [
    { sender: "coach", text: "Great Call 1. Complete resume + LinkedIn tasks to unlock Call 2." },
  ],
  "call-2": [{ sender: "coach", text: "Share one target JD before we meet for Call 2." }],
  "post-call-2": [
    { sender: "coach", text: "Now stay consistent. Finish quality applications + branding video." },
  ],
  "call-3": [{ sender: "coach", text: "Bring your interview doubts. We will sharpen your narrative." }],
  complete: [{ sender: "coach", text: "You made it. Keep following the system weekly." }],
};

type ViewMode = "student" | "coach";

type CoachRosterSort = "actions" | "joined" | "progress";

type StudentUnicoachProgress = {
  completedTaskIds: string[];
  chatByStage: Record<string, { sender: "coach" | "student"; text: string }[]>;
  /** Max stage index (0-based) the coach has explicitly opened; merges with natural progress. */
  coachUnlockThrough: number | null;
  /** Stage ids where the student tapped the primary CTA to book a call. */
  pendingCallRequestStageIds: string[];
};

/** Coach-facing program / pipeline status (demo seed; replace with API). */
type CoachStudentPipelineStatus =
  | "not_started"
  | "started"
  | "call_1"
  | "call_2"
  | "call_3"
  | "completed"
  | "interviewing"
  | "offered"
  | "refunded";

const PIPELINE_STATUS_LABELS: Record<CoachStudentPipelineStatus, string> = {
  not_started: "Not started",
  started: "Started",
  call_1: "Call 1",
  call_2: "Call 2",
  call_3: "Call 3",
  completed: "Completed",
  interviewing: "Interviewing",
  offered: "Offered",
  refunded: "Refunded",
};

const COACH_PIPELINE_STATUSES_ORDERED: CoachStudentPipelineStatus[] = [
  "not_started",
  "started",
  "call_1",
  "call_2",
  "call_3",
  "completed",
  "interviewing",
  "offered",
  "refunded",
];

type CoachRosterStatusFilter = "all" | CoachStudentPipelineStatus;

/** Coach-only student profile fields (demo seed; replace with API). */
type CoachClosedBy = "Shki" | "Sujan" | "Neha";
type CoachConversionMode = "1:1" | "Webinar" | "Product";

const COACH_CLOSED_BY_OPTIONS: readonly CoachClosedBy[] = ["Shki", "Sujan", "Neha"];
const COACH_CONVERSION_MODE_OPTIONS: readonly CoachConversionMode[] = ["1:1", "Webinar", "Product"];

type CoachStudentProfileFields = {
  location: string;
  role: string;
  closedBy: CoachClosedBy;
  conversionMode: CoachConversionMode;
};

/** Matches plain `<dd>` text under the profile details list (start date / body line). */
const coachProfilePlainValueInputClass =
  "w-full min-w-0 border-0 bg-transparent p-0 text-inherit shadow-none outline-none ring-0 focus:ring-0 placeholder:text-slate-400/90 dark:placeholder:text-slate-500";

/** Pill dropdown: same scale/color family as the list, compact rounded-full select. */
const coachProfilePillSelectClass =
  "inline-flex max-w-full cursor-pointer appearance-none rounded-full border border-slate-200/90 bg-slate-100/80 py-0.5 pl-2.5 pr-7 text-xs font-normal text-inherit shadow-none outline-none ring-0 transition hover:bg-slate-200/70 focus-visible:ring-2 focus-visible:ring-brand-500/35 dark:border-slate-600 dark:bg-slate-800/70 dark:hover:bg-slate-700/70";

function pipelineStatusBadgeClasses(status: CoachStudentPipelineStatus): string {
  const base =
    "shrink-0 inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  switch (status) {
    case "not_started":
      return `${base} bg-red-100 text-red-900 dark:bg-red-950/55 dark:text-red-200`;
    case "started":
      return `${base} bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200`;
    case "call_1":
    case "call_2":
    case "call_3":
      return `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200`;
    case "interviewing":
      return `${base} bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200`;
    case "offered":
      return `${base} bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200`;
    case "refunded":
      return `${base} bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

function formatRosterStartDate(isoDate: string): string {
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function linkedInPathLabel(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\//, "");
    return path.length > 36 ? `${path.slice(0, 34)}…` : path || "Profile";
  } catch {
    return "LinkedIn";
  }
}

function telHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : `tel:${encodeURIComponent(phone)}`;
}

function programProgressRingStroke(percent: number): string {
  const p = Math.min(100, Math.max(0, percent));
  if (p < 10) return "#dc2626";
  if (p < 50) return "#ca8a04";
  if (p < 90) return "#16a34a";
  return "#2563eb";
}

function AvatarWithProgressRing({
  src,
  alt,
  percent,
  size,
  className,
}: {
  src: string;
  alt: string;
  percent: number;
  size: "card" | "header";
  className?: string;
}) {
  const cfg =
    size === "card"
      ? { outer: 60, stroke: 3.25, img: 48 }
      : { outer: 52, stroke: 2.75, img: 40 };
  const { outer, stroke, img } = cfg;
  const cx = outer / 2;
  const cy = outer / 2;
  const r = Math.max(0, outer / 2 - stroke / 2 - 0.5);
  const circ = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const offset = circ * (1 - p / 100);
  const strokeColor = programProgressRingStroke(p);
  const pad = (outer - img) / 2;

  return (
    <div
      className={`relative shrink-0 ${className ?? ""}`}
      style={{ width: outer, height: outer }}
      role="img"
      aria-label={`Program progress ${Math.round(p)}%`}
    >
      <svg
        width={outer}
        height={outer}
        className="pointer-events-none absolute left-0 top-0"
        aria-hidden
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="text-slate-200 dark:text-slate-700"
            stroke="currentColor"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </g>
      </svg>
      <img
        src={src}
        alt={alt}
        width={img}
        height={img}
        referrerPolicy="no-referrer"
        className="absolute rounded-full border border-slate-200 object-cover bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
        style={{ width: img, height: img, left: pad, top: pad }}
      />
    </div>
  );
}

type RosterStudent = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  /** ISO date (demo) — shown as start date; used for coach desk sorting */
  joinedAt: string;
  phone: string;
  linkedInUrl: string;
  pipelineStatus: CoachStudentPipelineStatus;
  location: string;
  role: string;
  closedBy: CoachClosedBy;
  conversionMode: CoachConversionMode;
};

function rosterToCoachProfileFields(s: RosterStudent): CoachStudentProfileFields {
  return {
    location: s.location,
    role: s.role,
    closedBy: s.closedBy,
    conversionMode: s.conversionMode,
  };
}

function cloneStageChatSeed(): Record<string, { sender: "coach" | "student"; text: string }[]> {
  return JSON.parse(JSON.stringify(STAGE_CHAT_SEED)) as Record<
    string,
    { sender: "coach" | "student"; text: string }[]
  >;
}

function emptyProgress(): StudentUnicoachProgress {
  return {
    completedTaskIds: [],
    chatByStage: cloneStageChatSeed(),
    coachUnlockThrough: null,
    pendingCallRequestStageIds: [],
  };
}

function computeFirstIncompleteStageIndex(completedTaskIds: string[]): number {
  const index = STAGES.findIndex((stage) =>
    stage.tasks.some((task) => !completedTaskIds.includes(`${stage.id}:${task}`))
  );
  return index === -1 ? STAGES.length - 1 : index;
}

function effectiveUnlockStageIndex(
  firstIncompleteStageIndex: number,
  coachUnlockThrough: number | null
): number {
  if (coachUnlockThrough == null) return firstIncompleteStageIndex;
  return Math.max(firstIncompleteStageIndex, coachUnlockThrough);
}

function getStageStatusForProgress(
  stage: Stage,
  index: number,
  activeStageId: string,
  completedTaskIds: string[],
  coachUnlockThrough: number | null
): "locked" | "complete" | "active" | "unlocked" {
  const firstIncomplete = computeFirstIncompleteStageIndex(completedTaskIds);
  const maxUnlockedIndex = effectiveUnlockStageIndex(firstIncomplete, coachUnlockThrough);
  if (index > maxUnlockedIndex) return "locked";
  const stageTasksDone = stage.tasks.every((task) =>
    completedTaskIds.includes(`${stage.id}:${task}`)
  );
  if (stageTasksDone) return "complete";
  if (stage.id === activeStageId) return "active";
  return "unlocked";
}

const CURRENT_STUDENT_ID = "student-self";

/** Avatar shown for the coach in chat and floating chat UI. */
const COACH_PROFILE_AVATAR_URL = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("unicoach-coach")}`;

const STUDENT_ROSTER: RosterStudent[] = [
  {
    id: CURRENT_STUDENT_ID,
    name: "You",
    email: "student@unimad.app",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(CURRENT_STUDENT_ID)}`,
    joinedAt: "2025-05-01",
    phone: "+1 (555) 010-0001",
    linkedInUrl: "https://www.linkedin.com/in/student-self",
    pipelineStatus: "started",
    location: "Remote — US",
    role: "Student",
    closedBy: "Neha",
    conversionMode: "Webinar",
  },
  {
    id: "stu-alex",
    name: "Alex Rivera",
    email: "alex.rivera@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-alex")}`,
    joinedAt: "2025-03-10",
    phone: "+1 (415) 555-0142",
    linkedInUrl: "https://www.linkedin.com/in/alex-rivera-career",
    pipelineStatus: "call_1",
    location: "San Francisco, CA",
    role: "Product Marketing Manager",
    closedBy: "Shki",
    conversionMode: "1:1",
  },
  {
    id: "stu-jamie",
    name: "Jamie Chen",
    email: "jamie.chen@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-jamie")}`,
    joinedAt: "2025-04-18",
    phone: "+1 (646) 555-0198",
    linkedInUrl: "https://www.linkedin.com/in/jamie-chen-pm",
    pipelineStatus: "call_2",
    location: "New York, NY",
    role: "Senior PM",
    closedBy: "Sujan",
    conversionMode: "Product",
  },
  {
    id: "stu-morgan",
    name: "Morgan Blake",
    email: "morgan.blake@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-morgan")}`,
    joinedAt: "2025-02-28",
    phone: "+44 20 7946 0955",
    linkedInUrl: "https://www.linkedin.com/in/morgan-blake-uk",
    pipelineStatus: "interviewing",
    location: "London, UK",
    role: "UX Lead",
    closedBy: "Neha",
    conversionMode: "Webinar",
  },
  {
    id: "stu-priya",
    name: "Priya Nair",
    email: "priya.nair@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-priya")}`,
    joinedAt: "2024-11-20",
    phone: "+1 (312) 555-0167",
    linkedInUrl: "https://www.linkedin.com/in/priya-nair",
    pipelineStatus: "offered",
    location: "Chicago, IL",
    role: "Data Analyst",
    closedBy: "Shki",
    conversionMode: "1:1",
  },
  {
    id: "stu-jordan",
    name: "Jordan Wells",
    email: "jordan.wells@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-jordan")}`,
    joinedAt: "2025-07-01",
    phone: "+1 (206) 555-0134",
    linkedInUrl: "https://www.linkedin.com/in/jordan-wells",
    pipelineStatus: "call_3",
    location: "Seattle, WA",
    role: "Engineering Manager",
    closedBy: "Sujan",
    conversionMode: "Webinar",
  },
  {
    id: "stu-sam-o",
    name: "Sam Okonkwo",
    email: "sam.okonkwo@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-sam-o")}`,
    joinedAt: "2025-06-15",
    phone: "+234 803 555 0123",
    linkedInUrl: "https://www.linkedin.com/in/sam-okonkwo",
    pipelineStatus: "refunded",
    location: "Lagos, Nigeria",
    role: "Founder",
    closedBy: "Neha",
    conversionMode: "Product",
  },
  {
    id: "stu-casey",
    name: "Casey Kim",
    email: "casey.kim@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-casey")}`,
    joinedAt: "2025-08-01",
    phone: "+1 (424) 555-0189",
    linkedInUrl: "https://www.linkedin.com/in/casey-kim",
    pipelineStatus: "not_started",
    location: "Los Angeles, CA",
    role: "Brand Designer",
    closedBy: "Shki",
    conversionMode: "Product",
  },
  {
    id: "stu-river",
    name: "River Quinn",
    email: "river.quinn@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-river")}`,
    joinedAt: "2025-01-10",
    phone: "+1 (503) 555-0171",
    linkedInUrl: "https://www.linkedin.com/in/river-quinn",
    pipelineStatus: "completed",
    location: "Portland, OR",
    role: "Customer Success",
    closedBy: "Sujan",
    conversionMode: "1:1",
  },
  {
    id: "stu-ken",
    name: "Ken Martinez",
    email: "ken.martinez@email.com",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent("stu-ken")}`,
    joinedAt: "2025-09-05",
    phone: "+1 (602) 555-0140",
    linkedInUrl: "https://www.linkedin.com/in/ken-martinez",
    pipelineStatus: "started",
    location: "Phoenix, AZ",
    role: "Sales Development Rep",
    closedBy: "Neha",
    conversionMode: "Webinar",
  },
];

/** Coach desk only — no preview / self row. */
const COACH_ROSTER = STUDENT_ROSTER.filter((s) => s.id !== CURRENT_STUDENT_ID);

function initialCoachStudentProfileFieldsById(): Record<string, CoachStudentProfileFields> {
  return Object.fromEntries(
    STUDENT_ROSTER.map((s) => [
      s.id,
      {
        location: s.location,
        role: s.role,
        closedBy: s.closedBy,
        conversionMode: s.conversionMode,
      },
    ])
  ) as Record<string, CoachStudentProfileFields>;
}

function initialPipelineStatusByStudentId(): Record<string, CoachStudentPipelineStatus> {
  return Object.fromEntries(STUDENT_ROSTER.map((s) => [s.id, s.pipelineStatus])) as Record<
    string,
    CoachStudentPipelineStatus
  >;
}

export type UnicoachProps = {
  /** Locks the screen to student or coach; hides the in-page mode switch. Omit to allow Student/Coach toggle (e.g. legacy shell). */
  fixedMode?: "student" | "coach";
};

function initialProgressByStudentId(): Record<string, StudentUnicoachProgress> {
  const call1 = STAGES[0];
  const call1TaskIds = call1.tasks.map((task) => `${call1.id}:${task}`);
  const post1 = STAGES[1];
  const post1TaskIds = post1.tasks.map((task) => `${post1.id}:${task}`);
  const call2 = STAGES[2];
  const call2TaskIds = call2.tasks.map((task) => `${call2.id}:${task}`);

  return {
    [CURRENT_STUDENT_ID]: emptyProgress(),
    "stu-alex": {
      ...emptyProgress(),
      completedTaskIds: call1TaskIds,
      pendingCallRequestStageIds: [call1.id],
    },
    "stu-jamie": {
      ...emptyProgress(),
      completedTaskIds: [...call1TaskIds, post1TaskIds[0]],
    },
    "stu-morgan": {
      ...emptyProgress(),
      completedTaskIds: [...call1TaskIds, ...post1TaskIds],
      pendingCallRequestStageIds: [post1.id],
    },
    "stu-priya": {
      ...emptyProgress(),
      completedTaskIds: [...call1TaskIds, ...post1TaskIds, ...call2TaskIds],
    },
    "stu-jordan": {
      ...emptyProgress(),
      pendingCallRequestStageIds: [call1.id, post1.id],
    },
    "stu-sam-o": {
      ...emptyProgress(),
      completedTaskIds: call1TaskIds.slice(0, 1),
    },
    "stu-casey": emptyProgress(),
    "stu-river": {
      ...emptyProgress(),
      completedTaskIds: [...call1TaskIds, ...post1TaskIds],
    },
    "stu-ken": emptyProgress(),
  };
}

const Unicoach: React.FC<UnicoachProps> = ({ fixedMode }) => {
  // TODO: Replace with real subscription check once billing/user plan is wired.
  const isUnpaidUser = true;
  const [switchableViewMode, setSwitchableViewMode] = useState<ViewMode>("student");
  const viewMode: ViewMode = fixedMode ?? switchableViewMode;
  const showModeToggle = fixedMode === undefined;
  const [coachSelectedStudentId, setCoachSelectedStudentId] = useState<string | null>(null);
  const [coachRosterSort, setCoachRosterSort] = useState<CoachRosterSort>("actions");
  const [coachRosterSearchQuery, setCoachRosterSearchQuery] = useState("");
  const [coachRosterStatusFilter, setCoachRosterStatusFilter] = useState<CoachRosterStatusFilter>("all");
  const [openRosterPipelineDropdownId, setOpenRosterPipelineDropdownId] = useState<string | null>(null);
  const [pipelineStatusByStudentId, setPipelineStatusByStudentId] = useState<
    Record<string, CoachStudentPipelineStatus>
  >(() => initialPipelineStatusByStudentId());
  const [progressByStudentId, setProgressByStudentId] = useState<Record<string, StudentUnicoachProgress>>(
    initialProgressByStudentId
  );
  const [coachStudentProfileFieldsById, setCoachStudentProfileFieldsById] = useState<
    Record<string, CoachStudentProfileFields>
  >(() => initialCoachStudentProfileFieldsById());

  const sortedCoachRoster = useMemo(() => {
    let list = COACH_ROSTER.filter((row) => {
      if (coachRosterStatusFilter === "all") return true;
      return pipelineStatusByStudentId[row.id] === coachRosterStatusFilter;
    });
    const q = coachRosterSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((row) => {
        const pipeline = pipelineStatusByStudentId[row.id] ?? row.pipelineStatus;
        const statusLabel = PIPELINE_STATUS_LABELS[pipeline].toLowerCase();
        const phoneNorm = row.phone.replace(/\s/g, "").toLowerCase();
        const qPhone = q.replace(/\s/g, "");
        return (
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          phoneNorm.includes(qPhone) ||
          linkedInPathLabel(row.linkedInUrl).toLowerCase().includes(q) ||
          statusLabel.includes(q)
        );
      });
    }
    list.sort((a, b) => {
      const pa = progressByStudentId[a.id] ?? emptyProgress();
      const pb = progressByStudentId[b.id] ?? emptyProgress();
      if (coachRosterSort === "actions") {
        const diff = pb.pendingCallRequestStageIds.length - pa.pendingCallRequestStageIds.length;
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }
      if (coachRosterSort === "joined") {
        return b.joinedAt.localeCompare(a.joinedAt);
      }
      const pct = (p: StudentUnicoachProgress) =>
        Math.round((p.completedTaskIds.length / TOTAL_UNICOACH_TASKS) * 100);
      const d = pct(pb) - pct(pa);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [
    progressByStudentId,
    coachRosterSort,
    coachRosterStatusFilter,
    coachRosterSearchQuery,
    pipelineStatusByStudentId,
  ]);

  useEffect(() => {
    if (openRosterPipelineDropdownId == null) return;
    const close = () => setOpenRosterPipelineDropdownId(null);
    const onPointerDown = (e: PointerEvent) => {
      const root = document.getElementById(`coach-roster-pipeline-dd-${openRosterPipelineDropdownId}`);
      if (root?.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openRosterPipelineDropdownId]);

  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [activeTab, setActiveTab] = useState<ContentTab>("overview");
  const [chatDraft, setChatDraft] = useState("");
  const [floatChatOpen, setFloatChatOpen] = useState(false);
  const [isLockOverlayDismissed, setIsLockOverlayDismissed] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [seenCoachMessageCountByStage, setSeenCoachMessageCountByStage] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        STAGES.map((stage) => [
          stage.id,
          (STAGE_CHAT_SEED[stage.id] ?? []).filter((msg) => msg.sender === "coach").length,
        ])
      )
  );

  const activeStudentId = viewMode === "student" ? CURRENT_STUDENT_ID : coachSelectedStudentId;
  const progress = activeStudentId ? progressByStudentId[activeStudentId] : null;
  const completedTaskIds = progress?.completedTaskIds ?? [];
  const chatByStage = progress?.chatByStage ?? STAGE_CHAT_SEED;
  const coachUnlockThrough = progress?.coachUnlockThrough ?? null;

  const patchProgressFn = (studentId: string, fn: (p: StudentUnicoachProgress) => StudentUnicoachProgress) => {
    setProgressByStudentId((prev) => {
      const current = prev[studentId] ?? emptyProgress();
      return { ...prev, [studentId]: fn(current) };
    });
  };

  const firstIncompleteStageIndex = useMemo(
    () => computeFirstIncompleteStageIndex(completedTaskIds),
    [completedTaskIds]
  );

  const activeStage = STAGES.find((stage) => stage.id === activeStageId) ?? STAGES[0];

  const totalTaskCount = STAGES.reduce((total, stage) => total + stage.tasks.length, 0);
  const completionPercent = Math.round((completedTaskIds.length / totalTaskCount) * 100);

  const completedCalls = [1, 2, 3].filter((milestone) => {
    const stageForCall = STAGES.find((stage) => stage.callMilestone === milestone);
    if (!stageForCall) return false;
    return stageForCall.tasks.every((task) =>
      completedTaskIds.includes(`${stageForCall.id}:${task}`)
    );
  }).length;

  /** Horizontal % along the bar for Call 1 / 2 / 3 prep gates (evenly spaced). */
  const callMilestonePercents = useMemo(() => {
    const count = 3;
    return Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * 100) as [
      number,
      number,
      number
    ];
  }, []);

  const allProgramTasksDone = useMemo(
    () =>
      STAGES.every((stage) =>
        stage.tasks.every((task) => completedTaskIds.includes(`${stage.id}:${task}`))
      ),
    [completedTaskIds]
  );

  const celebratedCallMilestonesRef = useRef<Set<number>>(new Set());
  const prevAllProgramDoneRef = useRef(allProgramTasksDone);

  const fireCallMilestoneConfetti = () => {
    confetti({
      particleCount: 130,
      spread: 72,
      origin: { y: 0.32 },
      ticks: 220,
      scalar: 0.95,
    });
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.28 },
      angle: 120,
      shapes: ["star"],
      scalar: 0.85,
    });
  };

  useEffect(() => {
    for (let call = 1; call <= completedCalls; call += 1) {
      if (celebratedCallMilestonesRef.current.has(call)) continue;
      const thresholdPercent = callMilestonePercents[call - 1] ?? 100;
      // Gate celebration until the progress fill has visually reached the star.
      if (completionPercent >= thresholdPercent) {
        fireCallMilestoneConfetti();
        celebratedCallMilestonesRef.current.add(call);
      }
    }
  }, [completedCalls, completionPercent, callMilestonePercents]);

  useEffect(() => {
    if (allProgramTasksDone && !prevAllProgramDoneRef.current) {
      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.42 },
        ticks: 280,
        colors: ["#2563eb", "#eab308", "#22c55e", "#f8fafc"],
      });
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.38 },
        angle: 90,
        shapes: ["star"],
        scalar: 0.75,
        colors: ["#eab308", "#fbbf24"],
      });
    }
    prevAllProgramDoneRef.current = allProgramTasksDone;
  }, [allProgramTasksDone]);

  const isActiveStageFullyComplete = activeStage.tasks.every((task) =>
    completedTaskIds.includes(`${activeStage.id}:${task}`)
  );

  const pendingCallNotifications = useMemo(() => {
    const rows: { studentId: string; name: string; stageId: string; stageTitle: string }[] = [];
    for (const roster of COACH_ROSTER) {
      const p = progressByStudentId[roster.id];
      if (!p) continue;
      for (const stageId of p.pendingCallRequestStageIds) {
        const st = STAGES.find((s) => s.id === stageId);
        rows.push({
          studentId: roster.id,
          name: roster.name,
          stageId,
          stageTitle: st?.title ?? stageId,
        });
      }
    }
    return rows;
  }, [progressByStudentId]);

  const toggleTask = (stageId: string, task: string) => {
    if (!activeStudentId || viewMode === "coach") return;
    const taskId = `${stageId}:${task}`;
    patchProgressFn(activeStudentId, (prev) => ({
      ...prev,
      completedTaskIds: prev.completedTaskIds.includes(taskId)
        ? prev.completedTaskIds.filter((id) => id !== taskId)
        : [...prev.completedTaskIds, taskId],
    }));
  };

  const handlePrimaryStageAction = () => {
    if (!activeStudentId || !isActiveStageFullyComplete) return;
    patchProgressFn(activeStudentId, (prev) => ({
      ...prev,
      pendingCallRequestStageIds: prev.pendingCallRequestStageIds.includes(activeStage.id)
        ? prev.pendingCallRequestStageIds
        : [...prev.pendingCallRequestStageIds, activeStage.id],
    }));
  };

  const handleSendMessage = () => {
    if (!chatDraft.trim() || !activeStudentId) return;
    const sender: "coach" | "student" = viewMode === "coach" ? "coach" : "student";
    patchProgressFn(activeStudentId, (prev) => ({
      ...prev,
      chatByStage: {
        ...prev.chatByStage,
        [activeStage.id]: [
          ...(prev.chatByStage[activeStage.id] ?? []),
          { sender, text: chatDraft.trim() },
        ],
      },
    }));
    setChatDraft("");
  };

  const dismissCallRequest = (studentId: string, stageId: string) => {
    patchProgressFn(studentId, (prev) => ({
      ...prev,
      pendingCallRequestStageIds: prev.pendingCallRequestStageIds.filter((id) => id !== stageId),
    }));
  };

  /** Coach opens a locked stage for the student (must match selected stage). */
  const coachUnlockStageAtIndex = (studentId: string, stageIndex: number) => {
    patchProgressFn(studentId, (prev) => {
      const firstInc = computeFirstIncompleteStageIndex(prev.completedTaskIds);
      const currentThrough = effectiveUnlockStageIndex(firstInc, prev.coachUnlockThrough);
      if (stageIndex <= currentThrough) return prev;
      return {
        ...prev,
        coachUnlockThrough: Math.max(prev.coachUnlockThrough ?? firstInc, stageIndex),
      };
    });
  };

  const unreadCoachMessageCount = useMemo(
    () =>
      STAGES.reduce((total, stage) => {
        const coachMessageCount = (chatByStage[stage.id] ?? []).filter((msg) => msg.sender === "coach").length;
        const seenCount = seenCoachMessageCountByStage[stage.id] ?? 0;
        return total + Math.max(0, coachMessageCount - seenCount);
      }, 0),
    [chatByStage, seenCoachMessageCountByStage]
  );

  const accordionKey = (kind: "overview" | "resources", index: number) => `${activeStage.id}:${kind}:${index}`;
  const isAccordionOpen = (kind: "overview" | "resources", index: number) =>
    accordionOpen[accordionKey(kind, index)] ?? (index === 0);
  const toggleAccordion = (kind: "overview" | "resources", index: number) => {
    const key = accordionKey(kind, index);
    setAccordionOpen((prev) => {
      const current = prev[key] ?? (index === 0);
      return { ...prev, [key]: !current };
    });
  };

  const markCurrentStageCoachMessagesSeen = () => {
    const coachMessageCount = (chatByStage[activeStage.id] ?? []).filter((msg) => msg.sender === "coach").length;
    setSeenCoachMessageCountByStage((prev) => ({
      ...prev,
      [activeStage.id]: coachMessageCount,
    }));
  };

  useEffect(() => {
    if (floatChatOpen) markCurrentStageCoachMessagesSeen();
  }, [activeStage.id, chatByStage, floatChatOpen]);

  const getStageStatus = (stage: Stage, index: number) =>
    getStageStatusForProgress(stage, index, activeStageId, completedTaskIds, coachUnlockThrough);

  const showUpgradeOverlay = isUnpaidUser && !isLockOverlayDismissed && viewMode === "student";

  const openCoachStudent = (studentId: string) => {
    setOpenRosterPipelineDropdownId(null);
    setCoachSelectedStudentId(studentId);
    const p = progressByStudentId[studentId];
    const firstInc = p ? computeFirstIncompleteStageIndex(p.completedTaskIds) : 0;
    const maxIdx = p ? effectiveUnlockStageIndex(firstInc, p.coachUnlockThrough) : 0;
    const defaultStage = STAGES[Math.min(maxIdx, STAGES.length - 1)] ?? STAGES[0];
    setActiveStageId(defaultStage.id);
    setActiveTab("overview");
  };

  const showJourney =
    viewMode === "student" || (viewMode === "coach" && Boolean(coachSelectedStudentId));
  const coachProfileStudent =
    coachSelectedStudentId ? COACH_ROSTER.find((s) => s.id === coachSelectedStudentId) : null;
  const coachProfileFields: CoachStudentProfileFields | null = coachProfileStudent
    ? (coachStudentProfileFieldsById[coachProfileStudent.id] ?? rosterToCoachProfileFields(coachProfileStudent))
    : null;

  const isCoachStudentProfile = viewMode === "coach" && Boolean(coachSelectedStudentId);
  const activeStageIndex = STAGES.findIndex((s) => s.id === activeStage.id);
  const activeStageCoachLocked =
    isCoachStudentProfile &&
    activeStageIndex >= 0 &&
    getStageStatus(activeStage, activeStageIndex) === "locked";

  const showFloatingChat =
    viewMode === "student" || (viewMode === "coach" && Boolean(coachSelectedStudentId));

  useEffect(() => {
    if (!showFloatingChat) setFloatChatOpen(false);
  }, [showFloatingChat]);

  return (
    <>
    <div className="relative flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 space-y-4">
        {isCoachStudentProfile && (
          <div>
            <button
              type="button"
              onClick={() => setCoachSelectedStudentId(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <ArrowLeft size={14} /> All students
            </button>
          </div>
        )}
        <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 lg:p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-1 gap-3 items-start">
              {isCoachStudentProfile && coachProfileStudent ? (
                <>
                  <img
                    src={coachProfileStudent.avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover bg-slate-100 dark:border-slate-600 dark:bg-slate-800 sm:h-11 sm:w-11"
                    width={44}
                    height={44}
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-tight truncate">
                      {coachProfileStudent.name}
                    </h1>
                    <div className="mt-1.5 space-y-1 text-[11px] sm:text-xs">
                      <a
                        href={`mailto:${coachProfileStudent.email}`}
                        className="block truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {coachProfileStudent.email}
                      </a>
                      <a
                        href={telHref(coachProfileStudent.phone)}
                        className="block truncate font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {coachProfileStudent.phone}
                      </a>
                      {coachProfileFields ? (
                        <input
                          type="text"
                          value={coachProfileFields.role}
                          onChange={(e) => {
                            const v = e.target.value;
                            const id = coachProfileStudent.id;
                            setCoachStudentProfileFieldsById((prev) => ({
                              ...prev,
                              [id]: { ...(prev[id] ?? rosterToCoachProfileFields(coachProfileStudent)), role: v },
                            }));
                          }}
                          className="block w-full max-w-md truncate border-0 bg-transparent p-0 text-[11px] font-normal text-slate-700 shadow-none outline-none ring-0 focus:ring-0 placeholder:text-slate-400/90 sm:text-xs dark:text-slate-300 dark:placeholder:text-slate-500"
                          placeholder="Role"
                          aria-label="Role"
                          autoComplete="off"
                        />
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="min-w-0">
                  <h1
                    className={`font-semibold text-slate-900 dark:text-white leading-tight ${
                      viewMode === "student" ? "text-[24px] tracking-tight" : "text-lg sm:text-xl"
                    }`}
                  >
                    {viewMode === "coach" ? "Coach desk" : "Unicoach Journey"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {viewMode === "coach"
                      ? "Select a student to review stages and tasks."
                      : "No stage skipping. Complete mandatory tasks to unlock the next stage."}
                  </p>
                </div>
              )}
            </div>
            <div
              className={`flex w-full flex-wrap justify-end gap-2 shrink-0 sm:w-auto ${
                isCoachStudentProfile ? "items-end" : "items-start"
              }`}
            >
              {showJourney && isCoachStudentProfile && coachProfileStudent ? (
                <div className="flex w-full max-w-full items-stretch gap-2 sm:w-auto sm:flex-nowrap">
                  <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 self-stretch sm:max-w-[220px] sm:w-[200px]">
                    <div className="flex h-full min-h-0 flex-col justify-center rounded-lg border border-slate-200 px-2 py-2 dark:border-slate-700 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Progress
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">
                        {completionPercent}%
                      </p>
                    </div>
                    <div className="flex h-full min-h-0 flex-col justify-center rounded-lg border border-slate-200 px-2 py-2 dark:border-slate-700 sm:px-2.5 sm:py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Calls</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">
                        {completedCalls}/3
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-auto sm:min-w-[10.75rem]">
                    <Link
                      href="/uniboard/portfolio"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-center text-xs font-medium text-white shadow-sm transition hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 sm:w-auto"
                    >
                      Open profile
                    </Link>
                    <div className="relative w-full">
                      <label htmlFor="coach-student-pipeline-status" className="sr-only">
                        Pipeline status
                      </label>
                      <select
                        id="coach-student-pipeline-status"
                        value={
                          pipelineStatusByStudentId[coachProfileStudent.id] ?? coachProfileStudent.pipelineStatus
                        }
                        onChange={(e) => {
                          const v = e.target.value as CoachStudentPipelineStatus;
                          setPipelineStatusByStudentId((prev) => ({
                            ...prev,
                            [coachProfileStudent.id]: v,
                          }));
                        }}
                        className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-left text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:bg-slate-50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-[#1a1a1a] dark:text-slate-100 dark:hover:bg-slate-800/80"
                      >
                        {COACH_PIPELINE_STATUSES_ORDERED.map((s) => (
                          <option key={s} value={s}>
                            {PIPELINE_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
              ) : (
                showJourney && (
                  <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] sm:max-w-none sm:w-[200px]">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Progress
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">
                        {completionPercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 sm:px-2.5 sm:py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Calls</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight sm:text-base">
                        {completedCalls}/3
                      </p>
                    </div>
                  </div>
                )
              )}
              {showModeToggle && (
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchableViewMode("student");
                      setCoachSelectedStudentId(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "student"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Student
                  </button>
                  <Link
                    href="/uniboard/unicoach/coach"
                    className="px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                  >
                    <Users size={14} /> Coach
                  </Link>
                </div>
              )}
            </div>
          </div>
          {isCoachStudentProfile && coachProfileStudent ? (
            <>
              {showJourney && (
                <div className="mt-4 sm:mt-5">
                  <div className="relative flex h-6 w-full items-center sm:h-7">
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden sm:h-1.5">
                      <div
                        className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    {([1, 2, 3] as const).map((call, i) => {
                      const done = completedCalls >= call;
                      const left = callMilestonePercents[i];
                      return (
                        <div
                          key={call}
                          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${left}%` }}
                          title={
                            done
                              ? `Call ${call} prep milestone complete`
                              : `Call ${call} prep milestone — finish tasks up to here on the journey`
                          }
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border shadow-sm ring-2 ring-white dark:ring-[#111] sm:h-6 sm:w-6 ${
                              done
                                ? "border-amber-300/90 bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 dark:border-amber-400/50 dark:from-amber-400/90 dark:via-yellow-300/80 dark:to-amber-500/90"
                                : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                            }`}
                          >
                            <Star
                              size={12}
                              className={
                                done ? "text-amber-800 dark:text-amber-100" : "text-slate-300 dark:text-slate-500"
                              }
                              fill={done ? "currentColor" : "none"}
                              strokeWidth={done ? 0 : 1.75}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <dl className="max-w-2xl space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24">
                      Start date
                    </dt>
                    <dd>{formatRosterStartDate(coachProfileStudent.joinedAt)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24">
                      LinkedIn
                    </dt>
                    <dd className="min-w-0">
                      <a
                        href={coachProfileStudent.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        <span className="break-all">{linkedInPathLabel(coachProfileStudent.linkedInUrl)}</span>
                      </a>
                    </dd>
                  </div>
                  {coachProfileFields ? (
                    <>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                        <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24">
                          Location
                        </dt>
                        <dd className="min-w-0">
                          <input
                            type="text"
                            value={coachProfileFields.location}
                            onChange={(e) => {
                              const v = e.target.value;
                              const id = coachProfileStudent.id;
                              setCoachStudentProfileFieldsById((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] ?? rosterToCoachProfileFields(coachProfileStudent)), location: v },
                              }));
                            }}
                            className={coachProfilePlainValueInputClass}
                            placeholder="City, region, or remote"
                            autoComplete="off"
                          />
                        </dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                        <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24">
                          Closed by
                        </dt>
                        <dd className="min-w-0">
                          <div className="relative inline-block max-w-full align-middle">
                            <label htmlFor={`coach-student-closed-by-${coachProfileStudent.id}`} className="sr-only">
                              Closed by
                            </label>
                            <select
                              id={`coach-student-closed-by-${coachProfileStudent.id}`}
                              value={coachProfileFields.closedBy}
                              onChange={(e) => {
                                const v = e.target.value as CoachClosedBy;
                                const id = coachProfileStudent.id;
                                setCoachStudentProfileFieldsById((prev) => ({
                                  ...prev,
                                  [id]: { ...(prev[id] ?? rosterToCoachProfileFields(coachProfileStudent)), closedBy: v },
                                }));
                              }}
                              className={coachProfilePillSelectClass}
                            >
                              {COACH_CLOSED_BY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 opacity-80 dark:text-slate-400"
                              aria-hidden
                            />
                          </div>
                        </dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                        <dt className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:w-24">
                          Mode
                        </dt>
                        <dd className="min-w-0">
                          <div className="relative inline-block max-w-full align-middle">
                            <label htmlFor={`coach-student-conversion-mode-${coachProfileStudent.id}`} className="sr-only">
                              Mode
                            </label>
                            <select
                              id={`coach-student-conversion-mode-${coachProfileStudent.id}`}
                              value={coachProfileFields.conversionMode}
                              onChange={(e) => {
                                const v = e.target.value as CoachConversionMode;
                                const id = coachProfileStudent.id;
                                setCoachStudentProfileFieldsById((prev) => ({
                                  ...prev,
                                  [id]: {
                                    ...(prev[id] ?? rosterToCoachProfileFields(coachProfileStudent)),
                                    conversionMode: v,
                                  },
                                }));
                              }}
                              className={coachProfilePillSelectClass}
                            >
                              {COACH_CONVERSION_MODE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 opacity-80 dark:text-slate-400"
                              aria-hidden
                            />
                          </div>
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              </div>
            </>
          ) : (
            showJourney && (
              <div className="mt-1.5 sm:mt-2">
                <div className="relative flex h-6 w-full items-center sm:h-7">
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden sm:h-1.5">
                    <div
                      className="h-full rounded-full bg-brand-600 dark:bg-brand-500 transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  {([1, 2, 3] as const).map((call, i) => {
                    const done = completedCalls >= call;
                    const left = callMilestonePercents[i];
                    return (
                      <div
                        key={call}
                        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${left}%` }}
                        title={
                          done
                            ? `Call ${call} prep milestone complete`
                            : `Call ${call} prep milestone — finish tasks up to here on the journey`
                        }
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border shadow-sm ring-2 ring-white dark:ring-[#111] sm:h-6 sm:w-6 ${
                            done
                              ? "border-amber-300/90 bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 dark:border-amber-400/50 dark:from-amber-400/90 dark:via-yellow-300/80 dark:to-amber-500/90"
                              : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          <Star
                            size={12}
                            className={
                              done ? "text-amber-800 dark:text-amber-100" : "text-slate-300 dark:text-slate-500"
                            }
                            fill={done ? "currentColor" : "none"}
                            strokeWidth={done ? 0 : 1.75}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </section>

        {viewMode === "coach" && !coachSelectedStudentId && pendingCallNotifications.length > 0 && (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-4"
          >
            <div className="mb-2 flex items-center gap-1.5 sm:mb-3">
              <Bell className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400 sm:h-4 sm:w-4" aria-hidden />
              <p className="text-xs font-medium text-amber-950 dark:text-amber-100 sm:text-sm">
                {pendingCallNotifications.length} call booking request
                {pendingCallNotifications.length === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {pendingCallNotifications.map((n) => (
                <li
                  key={`${n.studentId}-${n.stageId}`}
                  className="flex flex-col gap-1 rounded-lg border border-amber-200/90 bg-white/95 p-1.5 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40 sm:gap-1.5 sm:p-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-[11px] font-semibold leading-tight text-amber-950 dark:text-amber-50 sm:text-xs">
                      {n.name}
                    </p>
                    <p className="line-clamp-2 text-[10px] leading-snug text-amber-900/90 dark:text-amber-200/85">
                      {n.stageTitle}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-1">
                    <button
                      type="button"
                      title="Open profile"
                      onClick={() => {
                        openCoachStudent(n.studentId);
                        setActiveStageId(n.stageId);
                      }}
                      className="inline-flex min-h-7 min-w-0 flex-1 items-center justify-center rounded-md bg-amber-800/90 px-1 py-1 text-center text-[10px] font-medium leading-none text-white transition hover:bg-amber-900 sm:px-1.5 sm:text-[11px]"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissCallRequest(n.studentId, n.stageId)}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-amber-300/90 bg-white text-amber-900 transition hover:bg-amber-100/90 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
                      aria-label="Mark scheduled"
                      title="Mark scheduled"
                    >
                      <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {viewMode === "coach" && !coachSelectedStudentId && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full min-w-0 lg:max-w-md lg:flex-1">
                <label htmlFor="coach-roster-search" className="sr-only">
                  Search students
                </label>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="coach-roster-search"
                  type="search"
                  value={coachRosterSearchQuery}
                  onChange={(e) => setCoachRosterSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, status…"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <label htmlFor="coach-roster-status-filter" className="sr-only">
                    Filter by pipeline status
                  </label>
                  <select
                    id="coach-roster-status-filter"
                    value={coachRosterStatusFilter}
                    onChange={(e) => setCoachRosterStatusFilter(e.target.value as CoachRosterStatusFilter)}
                    className="min-w-[10.5rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 sm:flex-initial sm:min-w-[12rem]"
                  >
                    <option value="all">All statuses</option>
                    {COACH_PIPELINE_STATUSES_ORDERED.map((s) => (
                      <option key={s} value={s}>
                        {PIPELINE_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <label htmlFor="coach-roster-sort" className="sr-only">
                    Sort students
                  </label>
                  <select
                    id="coach-roster-sort"
                    value={coachRosterSort}
                    onChange={(e) => setCoachRosterSort(e.target.value as CoachRosterSort)}
                    className="min-w-[11rem] flex-1 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-8 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#111] dark:text-slate-100 sm:flex-initial"
                  >
                    <option value="actions">Actions (pending first)</option>
                    <option value="joined">Date joined (newest)</option>
                    <option value="progress">Progress (highest)</option>
                  </select>
                </div>
              </div>
            </div>
            {sortedCoachRoster.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {coachRosterSearchQuery.trim()
                  ? "No students match your search."
                  : coachRosterStatusFilter !== "all"
                    ? "No students match this status."
                    : "No students to show."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedCoachRoster.map((row) => {
                const p = progressByStudentId[row.id];
                const pending = p?.pendingCallRequestStageIds.length ?? 0;
                const done = p
                  ? Math.round(
                      (p.completedTaskIds.length / TOTAL_UNICOACH_TASKS) * 100
                    )
                  : 0;
                const pipeline = pipelineStatusByStudentId[row.id] ?? row.pipelineStatus;
                const linkedInLabel = linkedInPathLabel(row.linkedInUrl);
                return (
                  <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCoachStudent(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCoachStudent(row.id);
                      }
                    }}
                    className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-[#111] dark:hover:border-brand-500/40"
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <AvatarWithProgressRing
                          src={row.avatarUrl}
                          alt=""
                          percent={done}
                          size="card"
                        />
                        {pending > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-[#111]">
                            {pending}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate pr-1 text-sm font-semibold text-slate-900 dark:text-white">
                            {row.name}
                          </p>
                          <div
                            id={`coach-roster-pipeline-dd-${row.id}`}
                            className="relative shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              aria-expanded={openRosterPipelineDropdownId === row.id}
                              aria-controls={`coach-roster-pipeline-menu-${row.id}`}
                              aria-haspopup="listbox"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRosterPipelineDropdownId((cur) => (cur === row.id ? null : row.id));
                              }}
                              className={`${pipelineStatusBadgeClasses(pipeline)} cursor-pointer border border-transparent hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
                              title="Change pipeline status"
                            >
                              {PIPELINE_STATUS_LABELS[pipeline]}
                            </button>
                            {openRosterPipelineDropdownId === row.id ? (
                              <ul
                                id={`coach-roster-pipeline-menu-${row.id}`}
                                role="listbox"
                                aria-label="Pipeline status"
                                className="absolute right-0 z-40 mt-1 max-h-56 min-w-[11rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-[#1a1a1a]"
                              >
                                {COACH_PIPELINE_STATUSES_ORDERED.map((s) => (
                                  <li key={s} role="presentation">
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={s === pipeline}
                                      className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 ${
                                        s === pipeline ? "bg-slate-50 dark:bg-slate-800/80" : ""
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPipelineStatusByStudentId((prev) => ({
                                          ...prev,
                                          [row.id]: s,
                                        }));
                                        setOpenRosterPipelineDropdownId(null);
                                      }}
                                    >
                                      {PIPELINE_STATUS_LABELS[s]}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                        <a
                          href={`mailto:${row.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate text-xs text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {row.email}
                        </a>
                        <dl className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex gap-1.5">
                            <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Start</dt>
                            <dd className="min-w-0">{formatRosterStartDate(row.joinedAt)}</dd>
                          </div>
                          <div className="flex gap-1.5 items-baseline">
                            <dt className="w-14 shrink-0 text-slate-400 dark:text-slate-500">Phone</dt>
                            <dd className="min-w-0">
                              <a
                                href={telHref(row.phone)}
                                onClick={(e) => e.stopPropagation()}
                                className="break-all text-brand-600 hover:underline dark:text-brand-400"
                              >
                                {row.phone}
                              </a>
                            </dd>
                          </div>
                          <div className="flex gap-1.5 items-start">
                            <dt className="w-14 shrink-0 pt-0.5 text-slate-400 dark:text-slate-500">LinkedIn</dt>
                            <dd className="min-w-0">
                              <a
                                href={row.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-brand-600 hover:underline dark:text-brand-400"
                              >
                                <span className="break-all">{linkedInLabel}</span>
                              </a>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Select a student to open their program status.
            </p>
          </div>
        )}

        {showJourney && (
        <div
          key={coachSelectedStudentId ?? "student-journey"}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isCoachStudentProfile ? "profile-reveal" : ""}`}
        >
          <aside className={`space-y-2 ${isCoachStudentProfile ? "lg:col-span-5" : "lg:col-span-3"}`}>
            {STAGES.map((stage, index) => {
              const status = getStageStatus(stage, index);
              const isLocked = status === "locked";
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    if (isCoachStudentProfile || !isLocked) {
                      setActiveStageId(stage.id);
                      setActiveTab("overview");
                    }
                  }}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    stage.id === activeStage.id
                      ? "border-brand-200 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111] dark:hover:bg-slate-900/50"
                  } ${
                    isLocked
                      ? isCoachStudentProfile
                        ? "ring-1 ring-amber-200/70 dark:ring-amber-900/40 cursor-pointer"
                        : "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {status === "complete" ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : status === "locked" ? (
                        <Lock size={16} className="text-slate-400" />
                      ) : (
                        <Circle size={16} className="text-brand-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Stage {index + 1}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{stage.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{stage.subtitle}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {!isCoachStudentProfile && (
          <section className="space-y-4 lg:col-span-6">
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium text-slate-900 dark:text-white">{activeStage.title}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeStage.subtitle}</p>
                </div>
                {activeStage.isCallStage && (
                  <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)] dark:border-amber-300/50 dark:from-amber-300/80 dark:via-yellow-300/80 dark:to-amber-500/80 dark:shadow-[0_0_18px_rgba(245,158,11,0.3)] overflow-hidden">
                    <span className="pointer-events-none absolute -left-10 top-0 h-full w-8 bg-white/45 blur-[0.5px] [transform:skewX(-20deg)] [animation:unicoachShine_10s_ease-in-out_infinite]" />
                    <Star size={14} className="relative z-10 text-amber-800 dark:text-amber-100" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["overview", "resources"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              {activeTab === "overview" && (
                <div className="space-y-2">
                  {activeStage.overview.map((section, index) => {
                    const open = isAccordionOpen("overview", index);
                    return (
                      <div
                        key={`${activeStage.id}-ov-${index}`}
                        className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion("overview", index)}
                          className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <Sparkles size={16} className="text-brand-500 mt-0.5 shrink-0" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {section.title}
                            </span>
                          </div>
                          {open ? (
                            <ChevronUp size={16} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400 shrink-0" />
                          )}
                        </button>
                        {open && (
                          <div className="px-3 pb-3 pl-9 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                            {section.body}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "resources" && (
                <div className="space-y-2">
                  {activeStage.resources.map((resource, index) => {
                    const open = isAccordionOpen("resources", index);
                    const embedSrc = resource.videoUrl ? videoUrlToEmbedSrc(resource.videoUrl) : null;
                    const showVideoPlaceholder = Boolean(resource.hasVideo && !embedSrc);
                    const hasVideoVisual = Boolean(embedSrc || resource.hasVideo || resource.videoUrl);
                    return (
                      <div
                        key={`${activeStage.id}-res-${index}`}
                        className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion("resources", index)}
                          className="w-full flex items-center justify-between gap-3 text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <PlayCircle
                              size={16}
                              className={`mt-0.5 shrink-0 ${hasVideoVisual ? "text-brand-500" : "text-slate-400 dark:text-slate-500"}`}
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {resource.title}
                            </span>
                          </div>
                          {open ? (
                            <ChevronUp size={16} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400 shrink-0" />
                          )}
                        </button>
                        {open && (
                          <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                            {resource.body && (
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                                {resource.body}
                              </p>
                            )}
                            {embedSrc && (
                              <div className="pl-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-video">
                                <iframe
                                  title={resource.title}
                                  src={embedSrc}
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            {showVideoPlaceholder && (
                              <div
                                className="pl-7 aspect-video rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
                                aria-hidden
                              >
                                <PlayCircle size={28} strokeWidth={1.25} className="opacity-60" />
                                <span className="text-xs font-medium uppercase tracking-wide">Video</span>
                              </div>
                            )}
                            {resource.videoUrl && !embedSrc && !resource.hasVideo && (
                              <p className="text-xs text-amber-700 dark:text-amber-400 pl-7">
                                Video link could not be embedded. Use a YouTube URL or paste an embed link from your
                                host.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
          )}

          <aside className={`space-y-4 ${isCoachStudentProfile ? "lg:col-span-7" : "lg:col-span-3"}`}>
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Task checklist</p>
                {isCoachStudentProfile && activeStageCoachLocked && coachSelectedStudentId && (
                  <button
                    type="button"
                    onClick={() => coachUnlockStageAtIndex(coachSelectedStudentId, activeStageIndex)}
                    className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Unlock this stage
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-3">
                {activeStage.tasks.map((task) => {
                  const taskId = `${activeStage.id}:${task}`;
                  const checked = completedTaskIds.includes(taskId);
                  return (
                    <label
                      key={task}
                      className={`flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 ${
                        viewMode === "coach" ? "cursor-default opacity-95" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={viewMode === "coach"}
                        onChange={() => toggleTask(activeStage.id, task)}
                        className="h-4 w-4 min-h-4 min-w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 disabled:opacity-50"
                      />
                      <span className={`leading-5 ${checked ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300"}`}>
                        {task}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={!isActiveStageFullyComplete || viewMode === "coach"}
                onClick={viewMode === "student" ? handlePrimaryStageAction : undefined}
                className={`mt-3 w-full rounded-xl text-sm py-2.5 transition-colors ${
                  isActiveStageFullyComplete && viewMode === "student"
                    ? "bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {activeStage.nextActionLabel}
              </button>
            </div>
          </aside>
        </div>
        )}
      </div>

      {showFloatingChat && (
        <>
          {!floatChatOpen && (
            <button
              type="button"
              onClick={() => setFloatChatOpen(true)}
              className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800 shadow-lg transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a1a1a] dark:text-slate-100 dark:hover:bg-slate-900 md:bottom-6 md:right-6"
            >
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md dark:border-slate-700">
                <img
                  src={COACH_PROFILE_AVATAR_URL}
                  alt=""
                  className="h-full w-full object-cover"
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                />
              </span>
              <span>Chat</span>
              {unreadCoachMessageCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCoachMessageCount > 9 ? "9+" : unreadCoachMessageCount}
                </span>
              )}
            </button>
          )}
          {floatChatOpen && (
            <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[min(520px,72vh)] max-h-[72vh] flex-col border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:border-slate-700 dark:bg-[#141414] md:inset-x-auto md:bottom-6 md:right-6 md:h-[480px] md:max-h-[520px] md:w-[380px] md:rounded-2xl md:border md:shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={COACH_PROFILE_AVATAR_URL}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-600"
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">Coach chat</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {activeStage.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloatChatOpen(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {(chatByStage[activeStage.id] ?? []).map((message, idx) => (
                  <div
                    key={`${activeStage.id}-${idx}`}
                    className={`flex ${message.sender === "coach" ? "justify-start" : "justify-end"}`}
                  >
                    {message.sender === "coach" ? (
                      <div className="max-w-[88%] rounded-2xl rounded-bl-md px-3 py-2 text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {message.text}
                      </div>
                    ) : (
                      <div className="max-w-[88%] rounded-2xl rounded-br-md px-3 py-2 text-xs bg-brand-600 text-white">
                        {message.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={viewMode === "coach" ? "Message as coach…" : "Message your coach…"}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                    aria-label="Send message"
                  >
                    <SendHorizontal size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showUpgradeOverlay && (
        <div className="absolute inset-0 z-[120]">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/35 via-white/65 to-white/85 dark:from-black/30 dark:via-black/55 dark:to-black/72 backdrop-blur-[2px]" />
          <button
            type="button"
            onClick={() => setIsLockOverlayDismissed(true)}
            className="absolute right-4 top-4 z-[60] pointer-events-auto h-9 w-9 rounded-full border border-white/70 dark:border-white/20 bg-white/80 dark:bg-black/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-black/70 transition-colors inline-flex items-center justify-center"
            aria-label="Bypass lock"
            title="Bypass lock"
          >
            <X size={16} />
          </button>
          <div className="absolute inset-0 z-[55] pointer-events-none flex items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-[#0f0f0f]/90 shadow-[0_16px_60px_rgba(15,23,42,0.18)] dark:shadow-[0_14px_44px_rgba(0,0,0,0.5)] px-6 py-7 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400 font-semibold">
                Unicoach Premium
              </p>
              <h3 className="mt-2 text-2xl font-medium text-slate-900 dark:text-white">
                Hire a coach. Get to your next job faster.
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Unlock the full coaching journey, task flow, and guided call milestones with 1:1 mentor support.
              </p>
              <button
                type="button"
                className="mt-5 pointer-events-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                Hire a Coach to Get Job Faster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <style jsx>{`
      @keyframes unicoachShine {
        0% { transform: translateX(0) skewX(-20deg); opacity: 0; }
        6% { transform: translateX(56px) skewX(-20deg); opacity: 0.9; }
        12% { transform: translateX(72px) skewX(-20deg); opacity: 0; }
        100% { transform: translateX(72px) skewX(-20deg); opacity: 0; }
      }
      @keyframes unicoachProfileReveal {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .profile-reveal {
        animation: unicoachProfileReveal 0.28s ease-out;
      }
    `}</style>
    </>
  );
};

export default Unicoach;